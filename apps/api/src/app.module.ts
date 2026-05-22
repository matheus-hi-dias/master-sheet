import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.number().default(15 * 60),
        JWT_REFRESH_EXPIRES_IN: Joi.number().default(7 * 24 * 60 * 60),
        CORS_ORIGINS: Joi.string().default(
          'http://localhost:5173,http://127.0.0.1:5173,http://localhost:19006,http://localhost:8081,http://10.0.2.2:3000',
        ),
        AUTH_DEBUG_TOKENS: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(false),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    AuthModule,
    PrismaModule,
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
