import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const configSwagger = new DocumentBuilder()
    .setTitle('Master Sheet API')
    .setDescription('API for the Master Sheet application')
    .setVersion('1.0')
    .addTag('templates')
    .addTag('auth')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, configSwagger);

  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
