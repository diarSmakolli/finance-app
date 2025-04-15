import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/emailService/email.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LoggerModule } from './modules/logger/logger.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { AppLoggerService } from './modules/logger/logger.service';
import { NotificationModule } from './modules/notifications/notification.module';
import { TicketModule } from './modules/ticket/ticket.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
    AuthModule,
    EmailModule,
    NotificationModule,
    TicketModule,
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: join(__dirname, '..', 'uploads'),
    }),
    LoggerModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ]
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    this.logger.log('Application starting...', 'AppModule');
    await this.validateConfigurations();
    this.logger.log('Application initialized successfully', 'AppModule');
  }

  private async validateConfigurations(): Promise<void> {
    try {
      // Email configuration validation
      this.logger.debug('Validating email configuration...', 'AppModule');
      const requiredEmailVars = ['APP_EMAIL_GMAIL', 'APP_PASSWORD_GMAIL'];
      const missingEmailVars = requiredEmailVars.filter(varName => !process.env[varName]);

      if (missingEmailVars.length > 0) {
        this.logger.error(
          `Missing email configuration! Required variables: ${missingEmailVars.join(', ')}`,
          undefined,
          'AppModule'
        );
        process.exit(1);
      }
      this.logger.log('Email configuration validated successfully', 'AppModule');

      // Database configuration validation
      this.logger.debug('Validating database configuration...', 'AppModule');
      const requiredDbVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
      const missingDbVars = requiredDbVars.filter(varName => !process.env[varName]);

      if (missingDbVars.length > 0) {
        this.logger.error(
          `Missing database configuration! Required variables: ${missingDbVars.join(', ')}`,
          undefined,
          'AppModule'
        );
        process.exit(1);
      }
      this.logger.log('Database configuration validated successfully', 'AppModule');

      // Log environment info
      this.logger.debug(`Running in ${process.env.NODE_ENV || 'development'} mode`, 'AppModule');
      this.logger.debug(`Database host: ${process.env.DB_HOST}`, 'AppModule');
      this.logger.debug(`Email configured for: ${process.env.APP_EMAIL_GMAIL}`, 'AppModule');

    } catch (error) {
      this.logger.error(
        'Failed to validate configurations',
        error.stack,
        'AppModule'
      );
      process.exit(1);
    }
  }
}