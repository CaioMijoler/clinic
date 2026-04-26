import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createLogger, format, transports } from 'winston';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(
      createLogger({
        level: process.env.LOG_LEVEL || 'debug',
        format: format.json(),
        transports: [new transports.Console()],
      }),
    ),
  });

  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get('port') || 3001;

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Clinic API')
      .setDescription('Clinical Backend System')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('/', app, document);

  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port, () => {
      Logger.log(`Application started on port: ${port}`, 'Bootstrap');
    });
  }

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Para execução local
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
