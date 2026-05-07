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
  const env = configService.get('env');

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
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.js',
    ],
  });

  if (env !== 'production') {
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

// Export default para a Vercel
export default async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};
