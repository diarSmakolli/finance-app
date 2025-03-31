import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from 'src/modules/logger/logger.service';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLoggerService,
  ) { }

  catch(exception: unknown, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      const status = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

      const message = exception instanceof Error
        ? exception.message
        : process.env.SERVER_ERROR_MSG;


      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        const errorDetails = {
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          body: request.body,
          query: request.query,
          params: request.params,
          error: {
            name: exception instanceof Error ? exception.name : 'Unknown Error',
            message: message,
            stack: exception instanceof Error ? exception.stack : undefined
          }
        };

        this.logger.error(
          `[${request.method}] ${request.url} - ${status} - ${message}`,
          exception instanceof Error ? exception.stack : undefined,
          'HttpExceptionFilter'
        );


        this.logger.error(
          `Detailed Error Information: ${JSON.stringify(errorDetails, null, 2)}`,
          undefined,
          'HttpExceptionFilter'
        );
      }

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    } catch (error) {
      this.logger.error(
        `Exception Filter Failed: ${error.message}`,
        error.stack,
        'HttpExceptionFilter'
      );

      // Ensure we always send a response
      const response = host.switchToHttp().getResponse<Response>();
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        message: process.env.SERVER_ERROR_MSG,
      });
    }
  }
}