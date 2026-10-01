import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type {
  AuthSession,
  AuthUserSummary,
  ClientPlatform,
  JwtPayload,
} from './types/auth.types';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailService } from '../mail/mail.service';

type RequestMeta = {
  ip?: string;
  userAgent?: string | string[];
};

type CookieSession = {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
  };
};

type SessionArtifacts = AuthSession & {
  refreshTokenRecordId: string;
};

type PublicAuthPayload = {
  access_token?: string;
  user: AuthUserSummary;
  refresh_token?: string;
  email_verification_required?: boolean;
  verification_token?: string;
  reset_token?: string;
};

type ServiceResult = {
  payload: PublicAuthPayload;
  refreshTokenCookie?: CookieSession;
};

@Injectable()
export class AuthService {
  private readonly refreshCookieName = 'master-sheet-refresh-token';
  private readonly failedLoginThreshold = 5;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  private get accessTokenTtlSeconds() {
    return this.config.get<number>('JWT_ACCESS_EXPIRES_IN') ?? 15 * 60;
  }

  private get refreshTokenTtlSeconds() {
    return (
      this.config.get<number>('JWT_REFRESH_EXPIRES_IN') ?? 7 * 24 * 60 * 60
    );
  }

  private get debugTokensEnabled() {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    if (isProduction) {
      return false;
    }
    return this.config.get<boolean>('AUTH_DEBUG_TOKENS') ?? false;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseCookie(header: string | undefined, cookieName: string) {
    if (!header) {
      return null;
    }

    const cookie = header
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.slice(cookieName.length + 1));
  }

  private buildCookie(token: string): CookieSession {
    return {
      name: this.refreshCookieName,
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: this.refreshTokenTtlSeconds * 1000,
      },
    };
  }

  private async getUserSummary(userId: string): Promise<AuthUserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async issueAccessToken(user: AuthUserSummary, jti: string) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        typ: 'access',
        jti,
      } satisfies JwtPayload,
      {
        expiresIn: this.accessTokenTtlSeconds,
      },
    );
  }

  private async issueSession(
    user: AuthUserSummary,
    meta: RequestMeta,
    clientPlatform: ClientPlatform,
  ): Promise<SessionArtifacts> {
    void clientPlatform;
    const refreshTokenJti = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        typ: 'refresh',
        jti: refreshTokenJti,
      } satisfies JwtPayload,
      {
        expiresIn: this.refreshTokenTtlSeconds,
      },
    );

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        jti: refreshTokenJti,
        userId: user.id,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
        deviceInfo:
          typeof meta.userAgent === 'string'
            ? meta.userAgent
            : meta.userAgent?.join('; '),
        ip: meta.ip,
      },
    });

    const accessToken = await this.issueAccessToken(user, refreshTokenJti);

    return {
      accessToken,
      refreshToken,
      refreshTokenRecordId: refreshTokenRecord.id,
      user,
    };
  }

  private buildResponse(
    session: SessionArtifacts,
    clientPlatform: ClientPlatform,
  ): ServiceResult {
    if (clientPlatform === 'mobile') {
      return {
        payload: {
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          user: session.user,
        },
      };
    }

    return {
      payload: {
        access_token: session.accessToken,
        user: session.user,
      },
      refreshTokenCookie: this.buildCookie(session.refreshToken),
    };
  }

  private async validateRefreshToken(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET') as string,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (record.revoked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revoked: false },
        data: { revoked: true },
      });
      this.logger.warn(
        `Refresh token reuse detected for userId: ${record.userId}. Revoking all active user sessions.`,
      );
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (record.jti !== payload.jti || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (!record.user) {
      throw new NotFoundException('User not found');
    }

    return { record, user: record.user };
  }

  private async clearFailedLogins(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
  }

  private async recordFailedLogin(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
      select: {
        failedLoginAttempts: true,
      },
    });

    if (user.failedLoginAttempts >= this.failedLoginThreshold) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    }
  }

  private async issueEmailVerificationToken(userId: string) {
    const token = randomBytes(32).toString('hex');

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  private async issuePasswordResetToken(userId: string) {
    const token = randomBytes(32).toString('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return token;
  }

  async register(
    user: RegisterDto,
    clientPlatform: ClientPlatform,
    _meta: RequestMeta,
  ) {
    void clientPlatform;
    void _meta;
    const userExists = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (userExists) {
      throw new ConflictException('E-mail already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
      },
    });

    const verificationToken = await this.issueEmailVerificationToken(
      newUser.id,
    );

    await this.mailService.sendVerificationEmail(
      newUser.email,
      verificationToken,
    );

    return {
      payload: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          emailVerified: newUser.emailVerified,
        },
        email_verification_required: true,
        ...(this.debugTokensEnabled
          ? { verification_token: verificationToken }
          : {}),
      },
    };
  }

  async login(
    loginDto: LoginDto,
    clientPlatform: ClientPlatform,
    meta: RequestMeta,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.recordFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.clearFailedLogins(user.id);

    const session = await this.issueSession(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      meta,
      clientPlatform,
    );

    return this.buildResponse(session, clientPlatform);
  }

  async refresh(
    tokenInput: { refreshToken?: string; cookieHeader?: string },
    clientPlatform: ClientPlatform,
    meta: RequestMeta,
  ) {
    const refreshToken =
      tokenInput.refreshToken ??
      this.parseCookie(tokenInput.cookieHeader, this.refreshCookieName);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    const { record, user } = await this.validateRefreshToken(refreshToken);
    const nextSession = await this.issueSession(user, meta, clientPlatform);

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: {
        revoked: true,
        lastUsedAt: new Date(),
        replacedBy: nextSession.refreshTokenRecordId,
      },
    });

    return this.buildResponse(nextSession, clientPlatform);
  }

  async logout(
    tokenInput: { refreshToken?: string; cookieHeader?: string },
    _clientPlatform: ClientPlatform,
  ) {
    const refreshToken =
      tokenInput.refreshToken ??
      this.parseCookie(tokenInput.cookieHeader, this.refreshCookieName);

    void _clientPlatform;

    if (!refreshToken) {
      return { message: 'Sessão encerrada com sucesso.' };
    }

    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: {
        revoked: true,
        lastUsedAt: new Date(),
      },
    });

    return { message: 'Sessão encerrada com sucesso.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.hashToken(dto.token);
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
      });

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid verification token.');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Verification token expired.');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { tokenHash },
    });

    return { message: 'Email verified successfully.' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If the account exists, a reset token was generated.' };
    }

    const resetToken = await this.issuePasswordResetToken(user.id);

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If the account exists, a reset token was generated.',
      ...(this.debugTokensEnabled ? { reset_token: resetToken } : {}),
    };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid password reset token.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await this.prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { used: true },
    });

    return { message: 'Password reset completed successfully.' };
  }
}
