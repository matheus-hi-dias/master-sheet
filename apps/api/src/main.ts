import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
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
