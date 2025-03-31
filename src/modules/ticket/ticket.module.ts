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

@Module({
    imports: [
        TypeOrmModule.forFeature([Ticket, TicketMessage, User, Session]),
        MulterModule.register(multerConfig),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'cdcdcdc123453',
            signOptions: { expiresIn: '1h' },
        }),
        LoggerModule
    ],
    controllers: [TicketController],
    providers: [TicketService],
    exports: [TicketService]
})
export class TicketModule { }