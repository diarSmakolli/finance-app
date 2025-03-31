import * as dotenv from "dotenv";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { AppLoggerService } from './modules/logger/logger.service';
import * as compression from 'compression';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { urlencoded, json } from 'express';

dotenv.config();

async function bootstrap() {
  try {
    // Create the app with logging
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const logger = app.get(AppLoggerService);
    logger.log('Bootstrapping application...', 'Main');

    // Security middlewares
    app.use(helmet());
    app.use(compression());
    
    // CORS configuration
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Body parser configuration
    app.use(json());
    app.use(urlencoded({ extended: true }));
    app.use(cookieParser());

    // Global prefix
    app.setGlobalPrefix('api');

    // Global pipes
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    // Global filters
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    // Swagger documentation
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Finance API')
        .setDescription('The Finance API description')
        .setVersion('1.0')
        .addBearerAuth()
        .addCookieAuth('accessToken')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      
      logger.log('Swagger documentation initialized at /api/docs', 'Main');
    }

    // Start the server
    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    logger.log(`Application is running on: ${process.env.APP_URL}:${port}`, 'Main');
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'Main');
  } catch (error) {
    Logger.error(`Error starting application: ${error.message}`, error.stack, 'Main');
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  Logger.error(
    `Unhandled Rejection at: ${promise}, reason: ${reason}`,
    undefined,
    'Main'
  );
});

process.on('uncaughtException', (error) => {
  Logger.error(
    `Uncaught Exception: ${error.message}`,
    error.stack,
    'Main'
  );
  process.exit(1);
});

bootstrap();