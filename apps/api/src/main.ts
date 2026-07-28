import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

function assertAuthConfig() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  const accessExpiresIn = Number(process.env.JWT_ACCESS_EXPIRES_IN);
  const refreshExpiresIn = Number(process.env.JWT_REFRESH_EXPIRES_IN);

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  if (!Number.isInteger(accessExpiresIn) || accessExpiresIn <= 0) {
    throw new Error(
      'JWT_ACCESS_EXPIRES_IN must be a positive integer in the environment variables',
    );
  }

  if (!Number.isInteger(refreshExpiresIn) || refreshExpiresIn <= 0) {
    throw new Error(
      'JWT_REFRESH_EXPIRES_IN must be a positive integer in the environment variables',
    );
  }
}

async function bootstrap() {
  assertAuthConfig();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('HTTP');

  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms - ${req.ip}`,
      );
    });

    next();
  });

  const origins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  console.log('CORS origins:', origins);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      console.log(`CORS origin not allowed: ${origin}`);
      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform'],
  });

  app.use(helmet());
  // Per-route rate limiters for sensitive auth endpoints
  const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many registration attempts, please try again later.',
  });

  const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many token refresh attempts, please try again later.',
  });

  const logoutLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many logout attempts, please try again later.',
  });

  const verifyEmailLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many verification attempts, please try again later.',
  });

  const passwordResetRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many password reset requests, please try again later.',
  });

  // Mount limiters on specific auth routes
  app.use('/auth/login', loginLimiter);
  app.use('/auth/register', registerLimiter);
  app.use('/auth/refresh', refreshLimiter);
  app.use('/auth/logout', logoutLimiter);
  app.use('/auth/verify-email', verifyEmailLimiter);
  app.use('/auth/password-reset/request', passwordResetRequestLimiter);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
