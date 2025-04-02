import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-massage.entity';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { LoggerModule } from '../logger/logger.module';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { Session } from '../users/entities/session.entity';
import { multerConfig } from '../../config/multer.config';
import { BullModule } from '@nestjs/bull';
import { TicketArchiveProcessor } from './processors/ticket-archive.processor';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from '../notifications/notification.entity';
@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Ticket, TicketMessage, User, Session, Notification]),
        MulterModule.register(multerConfig),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'cdcdcdc123453',
            signOptions: { expiresIn: '1h' },
        }),
        LoggerModule,
        BullModule.registerQueue({
            name: 'tickets',
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
    controllers: [TicketController],
    providers: [
        TicketService,
        TicketArchiveProcessor
    ],
    exports: [TicketService]
})
export class TicketModule { }