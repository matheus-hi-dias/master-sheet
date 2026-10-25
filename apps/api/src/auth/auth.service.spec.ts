jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    emailVerificationToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    passwordResetToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtServiceMock: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let configValues: Record<string, unknown>;
  let configServiceMock: {
    get: jest.Mock;
  };
  let mailServiceMock: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };

  const baseUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User',
    emailVerified: false,
    password: 'stored-password',
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      emailVerificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configValues = {
      JWT_SECRET: 'test-secret',
      JWT_ACCESS_EXPIRES_IN: 900,
      JWT_REFRESH_EXPIRES_IN: 604800,
      AUTH_DEBUG_TOKENS: false,
    };

    configServiceMock = {
      get: jest.fn((key: string) => configValues[key]),
    };

    mailServiceMock = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    const bcryptMock = bcrypt as unknown as {
      genSalt: jest.Mock;
      hash: jest.Mock;
      compare: jest.Mock;
    };

    bcryptMock.genSalt.mockResolvedValue('salt');
    bcryptMock.hash.mockResolvedValue('hashed-password');
    bcryptMock.compare.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends verification email on register and accepts the verification token', async () => {
    configValues.AUTH_DEBUG_TOKENS = true;
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      emailVerified: baseUser.emailVerified,
    });
    prismaMock.emailVerificationToken.create.mockResolvedValue({});
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      userId: baseUser.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.emailVerificationToken.delete.mockResolvedValue({});
    mailServiceMock.sendVerificationEmail.mockResolvedValue({});

    const registerResult = await service.register(
      {
        email: baseUser.email,
        password: 'password123',
        name: baseUser.name,
      },
      'web',
      {},
    );

    expect(registerResult.payload.email_verification_required).toBe(true);
    expect(registerResult.payload.verification_token).toBeDefined();
    expect(mailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
      baseUser.email,
      registerResult.payload.verification_token,
    );
    expect(prismaMock.emailVerificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: baseUser.id,
          tokenHash: sha256(
            registerResult.payload.verification_token as string,
          ),
        }),
      }),
    );

    await service.verifyEmail({
      token: registerResult.payload.verification_token as string,
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: { emailVerified: true },
    });
    expect(prismaMock.emailVerificationToken.delete).toHaveBeenCalledWith({
      where: {
        tokenHash: sha256(registerResult.payload.verification_token as string),
      },
    });
  });

  it('rotates refresh tokens on refresh and revokes them on logout', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      emailVerified: true,
      password: baseUser.password,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.refreshToken.create
      .mockResolvedValueOnce({ id: 'refresh-record-1' })
      .mockResolvedValueOnce({ id: 'refresh-record-2' });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh-record-1',
      userId: baseUser.id,
      revoked: false,
      jti: 'refresh-jti-1',
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: baseUser.id,
        email: baseUser.email,
        name: baseUser.name,
        emailVerified: true,
      },
    });
    prismaMock.refreshToken.update.mockResolvedValue({});
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('refresh-token-1')
      .mockResolvedValueOnce('access-token-1')
      .mockResolvedValueOnce('refresh-token-2')
      .mockResolvedValueOnce('access-token-2');
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: baseUser.id,
      email: baseUser.email,
      typ: 'refresh',
      jti: 'refresh-jti-1',
    });

    const loginResult = await service.login(
      {
        email: baseUser.email,
        password: 'password123',
      },
      'web',
      {},
    );

    expect(loginResult.payload.access_token).toBe('access-token-1');
    expect(loginResult.refreshTokenCookie?.value).toBe('refresh-token-1');

    const refreshResult = await service.refresh(
      {
        cookieHeader: 'master-sheet-refresh-token=refresh-token-1',
      },
      'web',
      {},
    );

    expect(refreshResult.payload.access_token).toBe('access-token-2');
    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh-record-1' },
      data: expect.objectContaining({
        revoked: true,
        replacedBy: 'refresh-record-2',
      }),
    });

    await service.logout({ refreshToken: 'refresh-token-2' }, 'web');

    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: sha256('refresh-token-2') },
      data: expect.objectContaining({ revoked: true }),
    });
  });

  it('rejects expired refresh tokens', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh-record-1',
      userId: baseUser.id,
      revoked: false,
      jti: 'refresh-jti-1',
      expiresAt: new Date(Date.now() - 60_000),
    });
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: baseUser.id,
      email: baseUser.email,
      typ: 'refresh',
      jti: 'refresh-jti-1',
    });

    await expect(
      service.refresh(
        {
          cookieHeader: 'master-sheet-refresh-token=refresh-token-1',
        },
        'web',
        {},
      ),
    ).rejects.toThrow('Invalid refresh token.');
  });

  it('sends password reset email and consumes the reset token', async () => {
    configValues.AUTH_DEBUG_TOKENS = true;
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.passwordResetToken.create.mockResolvedValue({});
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      userId: baseUser.id,
      used: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.passwordResetToken.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
    mailServiceMock.sendPasswordResetEmail.mockResolvedValue({});

    const requestResult = await service.requestPasswordReset({
      email: baseUser.email,
    });

    expect(requestResult.reset_token).toBeDefined();
    expect(mailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
      baseUser.email,
      requestResult.reset_token,
    );

    await service.confirmPasswordReset({
      token: requestResult.reset_token as string,
      password: 'new-password-123',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: expect.objectContaining({
        password: 'hashed-password',
        failedLoginAttempts: 0,
        lockoutUntil: null,
      }),
    });
    expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith({
      where: {
        tokenHash: sha256(requestResult.reset_token as string),
      },
      data: { used: true },
    });
  });

  it('locks the account after repeated failed logins', async () => {
    let failedLoginAttempts = 0;
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.user.update.mockImplementation((args: { data?: any }) => {
      const data = args?.data;
      if (data?.failedLoginAttempts?.increment) {
        failedLoginAttempts += 1;

        return Promise.resolve({ failedLoginAttempts });
      }

      return Promise.resolve({
        ...baseUser,
        ...data,
      });
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.login(
          {
            email: baseUser.email,
            password: 'wrong-password',
          },
          'web',
          {},
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lockoutUntil: expect.any(Date),
        }),
      }),
    );

    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

    await expect(
      service.login(
        {
          email: baseUser.email,
          password: 'password123',
        },
        'web',
        {},
      ),
    ).rejects.toThrow('Account temporarily locked.');
  });

  it('revokes all user sessions when a revoked refresh token reuse is detected', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: baseUser.id,
      email: baseUser.email,
      typ: 'refresh',
      jti: 'reused-jti',
    });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'revoked-record-id',
      userId: baseUser.id,
      revoked: true,
      jti: 'reused-jti',
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: baseUser.id,
        email: baseUser.email,
        name: baseUser.name,
        emailVerified: true,
      },
    });
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      service.refresh({ refreshToken: 'revoked-token-value' }, 'web', {}),
    ).rejects.toThrow(UnauthorizedException);

    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: baseUser.id, revoked: false },
      data: { revoked: true },
    });
  });
});
