import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { User } from '../users/entities/user.entity';
import { Session } from '../users/entities/session.entity';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from '../logger/logger.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, User, Session]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'cdcdcdc123453',
            signOptions: { expiresIn: '1h' },
        }),
        LoggerModule
    ],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService]
})
export class NotificationModule {}
