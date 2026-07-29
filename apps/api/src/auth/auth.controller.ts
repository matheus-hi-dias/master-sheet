import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Headers,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetCurrentUser } from './decorators/get-user.decorator';
import type { ActiveUser, ClientPlatform } from './types/auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  private resolvePlatform(platform?: string): ClientPlatform {
    return platform === 'mobile' ? 'mobile' : 'web';
  }

  private sanitizeRedirectUrl(redirectUrl?: string): string {
    const configuredBase =
      this.config.get<string>('EMAIL_VERIFY_REDIRECT_BASE') ||
      this.config.get<string>('FRONTEND_URL') ||
      this.config.get<string>('APP_URL') ||
      'http://localhost:3000';

    if (!redirectUrl) {
      return configuredBase;
    }

    if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return `${configuredBase.replace(/\/$/, '')}${redirectUrl}`;
    }

    try {
      const targetUrl = new URL(redirectUrl);
      const allowedUrl = new URL(configuredBase);

      if (targetUrl.origin === allowedUrl.origin) {
        return redirectUrl;
      }
    } catch {
      // Invalid URL format
    }

    return configuredBase;
  }

  @Post('register')
  @Throttle({ strictAuth: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Registra um novo usuário no sistema.' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail indisponível.' })
  async register(
    @Body() user: RegisterDto,
    @Req() request: Request,
    @Headers('x-client-platform') platform = 'web',
  ) {
    return this.authService.register(user, this.resolvePlatform(platform), {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('login')
  @Throttle({ strictAuth: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Autentica o usuário e retorna o token JWT.' })
  @ApiResponse({ status: 201, description: 'Login feito com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('x-client-platform') platform = 'web',
  ) {
    const result = await this.authService.login(
      loginDto,
      this.resolvePlatform(platform),
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    );

    if (result.refreshTokenCookie) {
      response.cookie(
        result.refreshTokenCookie.name,
        result.refreshTokenCookie.value,
        result.refreshTokenCookie.options,
      );
    }

    return result.payload;
  }

  @Post('refresh')
  @Throttle({ tokenRefresh: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Rotaciona o refresh token e retorna um novo access token.',
  })
  @ApiResponse({ status: 201, description: 'Tokens renovados com sucesso.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado.',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('x-client-platform') platform = 'web',
  ) {
    const result = await this.authService.refresh(
      {
        refreshToken: refreshTokenDto.refreshToken,
        cookieHeader: request.headers.cookie,
      },
      this.resolvePlatform(platform),
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    );

    if (result.refreshTokenCookie) {
      response.cookie(
        result.refreshTokenCookie.name,
        result.refreshTokenCookie.value,
        result.refreshTokenCookie.options,
      );
    }

    return result.payload;
  }

  @Post('logout')
  @Throttle({ strictAuth: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Revoga a sessão atual do usuário.' })
  @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso.' })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('x-client-platform') platform = 'web',
  ) {
    await this.authService.logout(
      {
        refreshToken: refreshTokenDto.refreshToken,
        cookieHeader: request.headers.cookie,
      },
      this.resolvePlatform(platform),
    );

    response.clearCookie('master-sheet-refresh-token');

    return { message: 'Sessão encerrada com sucesso.' };
  }

  @Post('verify-email')
  @Throttle({ strictAuth: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Valida o token de verificação de e-mail.' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Get('verify-email')
  @Throttle({ strictAuth: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verifica o e-mail por link e redireciona para a UI.',
  })
  async verifyEmailGet(
    @Req() request: Request,
    @Query('token') token: string,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
  ) {
    const wantsJson = request.accepts(['json', 'html']) === 'json';
    const redirectBase = this.sanitizeRedirectUrl(redirect);
    const target = redirectBase.endsWith('/email-verified')
      ? redirectBase
      : `${redirectBase.replace(/\/$/, '')}/email-verified`;

    const respond = (status: 'success' | 'expired' | 'invalid') => {
      if (wantsJson) {
        return res.status(200).json({ status });
      }

      return res.redirect(`${target}?status=${status}`);
    };

    if (!token) {
      return respond('invalid');
    }

    try {
      await this.authService.verifyEmail({ token });
      return respond('success');
    } catch (err) {
      // Map known verification errors to specific statuses
      const message = (err as Error).message || '';
      if (message.toLowerCase().includes('expired')) {
        return respond('expired');
      }

      return respond('invalid');
    }
  }

  @Post('password-reset/request')
  @Throttle({ passwordReset: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Gera um token de redefinição de senha.' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Redefine a senha usando um token de uso único.' })
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recupera as informações do usuário atual (logado).',
  })
  @ApiResponse({ status: 200, description: 'Usuário atual.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  getMe(@GetCurrentUser() user: ActiveUser) {
    return user;
  }
}
