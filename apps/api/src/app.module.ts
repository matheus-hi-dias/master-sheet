import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { TemplatesModule } from './templates/templates.module';
import Joi from 'joi';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().trim().min(1).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.number()
          .integer()
          .positive()
          .default(15 * 60),
        JWT_REFRESH_EXPIRES_IN: Joi.number()
          .integer()
          .positive()
          .default(7 * 24 * 60 * 60),
        CORS_ORIGINS: Joi.string().default(
          'http://localhost:5173,http://127.0.0.1:5173,http://localhost:19006,http://localhost:8081,http://10.0.2.2:3000',
        ),
        AUTH_DEBUG_TOKENS: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(false),
        SMTP_SERVICE: Joi.string().optional(),
        SMTP_HOST: Joi.string().optional(),
        SMTP_PORT: Joi.number().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASSWORD: Joi.string().optional(),
        SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
      {
        name: 'strictAuth',
        ttl: 60_000,
        limit: 5,
      },
      {
        name: 'passwordReset',
        ttl: 3_600_000,
        limit: 3,
      },
      {
        name: 'tokenRefresh',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    AuthModule,
    MailModule,
    PrismaModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
