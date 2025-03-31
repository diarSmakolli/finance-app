import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-massage.entity';
import { TicketStatus } from '../ticket.service';
import { AppLoggerService } from '../../logger/logger.service';
import { Job } from 'bull';

@Processor('tickets')
@Injectable()
export class TicketArchiveProcessor {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketMessage)
        private messageRepository: Repository<TicketMessage>,
        private readonly logger: AppLoggerService
    ) {}

    @OnQueueActive()
    onActive(job: Job) {
        this.logger.log(
            `Processing job ${job.id} of type ${job.name}`,
            'TicketArchiveProcessor'
        );
    }

    @OnQueueCompleted()
    onComplete(job: Job, result: any) {
        this.logger.log(
            `Job ${job.id} completed. Archived ${result.archived} tickets`,
            'TicketArchiveProcessor'
        );
    }

    @OnQueueFailed()
    onError(job: Job<any>, error: any) {
        this.logger.error(
            `Failed job ${job.id}: ${error.message}`,
            error.stack,
            'TicketArchiveProcessor'
        );
    }

    @Process('archive-inactive-tickets')
    async processInactiveTickets(job: Job) {
        try {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            // Find inactive tickets
            const inactiveTickets = await this.ticketRepository.find({
                where: {
                    lastMessageAt: LessThan(fiveDaysAgo),
                    status: Not(TicketStatus.ARCHIVED)
                },
                relations: ['messages', 'user', 'manager']
            });

            this.logger.log(
                `Found ${inactiveTickets.length} inactive tickets to archive`,
                'TicketArchiveProcessor'
            );

            let archivedCount = 0;

            for (const ticket of inactiveTickets) {
                // Create system message
                const systemMessage = this.messageRepository.create({
                    ticketId: ticket.id,
                    message: `Ticket automatically archived due to inactivity (no updates for 5 days)`,
                    isSystemMessage: true,
                    systemMessageType: 'AUTO_ARCHIVE',
                    attachments: []
                });

                // Update ticket status
                ticket.status = TicketStatus.ARCHIVED;
                ticket.lastMessageAt = new Date();

                await Promise.all([
                    this.messageRepository.save(systemMessage),
                    this.ticketRepository.save(ticket)
                ]);

                archivedCount++;

                this.logger.log(
                    `Archived ticket ${ticket.id} due to inactivity`,
                    'TicketArchiveProcessor'
                );
            }

            return {
                processed: inactiveTickets.length,
                archived: archivedCount,
                timestamp: new Date()
            };
        } catch (error) {
            this.logger.error(
                `Error during ticket archiving: ${error.message}`,
                error.stack,
                'TicketArchiveProcessor'
            );
            throw error;
        }
    }
}