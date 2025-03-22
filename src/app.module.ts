import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/emailService/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Validate email configuration
const validateEmailConfig = () => {
  if (!process.env.APP_EMAIL_GMAIL || !process.env.APP_PASSWORD_GMAIL) {
    console.error('Missing email configuration! Please check your environment variables.');
    process.exit(1);
  }
};

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
    AuthModule,
    EmailModule,
    EventEmitterModule.forRoot({
      // Global event emitter configuration
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
  ],
})
export class AppModule {
  constructor() {
    validateEmailConfig();
  }
}
