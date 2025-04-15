import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { User } from '../users/entities/user.entity';
import { Session } from '../users/entities/session.entity';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from '../logger/logger.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { MarkNotificationsProcessor } from './processors/mark-as-read.processor';
import { EmailModule } from '../emailService/email.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Notification, User, Session]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'cdcdcdc123453',
            signOptions: { expiresIn: '1h' },
        }),
        EmailModule,
        LoggerModule,
        BullModule.registerQueue({
            name: 'mark-notifications',
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT || 6379),
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 60000
                },
                removeOnComplete: true
            }
        }),
    ],
    controllers: [NotificationController],
    providers: [
        NotificationService,
        MarkNotificationsProcessor
    ],
    exports: [NotificationService]
})
export class NotificationModule {}
