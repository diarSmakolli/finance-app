import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { LoginHistory } from '../users/entities/loginhistory.entity';
import { Session } from '../users/entities/session.entity';
import { EmailModule } from '../emailService/email.module';
import { Notification } from '../notifications/notification.entity';
import { LoggerModule } from '../logger/logger.module';
import { BullModule } from '@nestjs/bull';
import { SendMailAuthProcessor } from './processors/send-mail.processor';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassportModule,
    TypeOrmModule.forFeature([User, LoginHistory, Session, Notification]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' }, 
    }),
    EmailModule,
    LoggerModule,
    BullModule.registerQueue({
      name: 'send-mail-auth',
      redis: {
        host: process.env.REDIST_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
        removeOnComplete: true,
      }
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SendMailAuthProcessor,
    GoogleStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}
