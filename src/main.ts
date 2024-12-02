import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createLogger, format, transports } from 'winston';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Initial Nest Factory app and config log to json format
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
  const port = configService.get('port');

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(process.env.npm_package_name)
      .setDescription(process.env.npm_package_description)
      .setVersion(process.env.npm_package_version)
      .setContact(
        process.env.npm_package_description,
        process.env.npm_package_homepage,
        process.env.npm_package_author,
      )
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('/', app, document);

  await app.listen(port, () => {
    Logger.log(`Application started on port: ${port}`, 'Bootstrap');
  });
}
bootstrap();
