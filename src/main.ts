import * as dotenv from "dotenv";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
