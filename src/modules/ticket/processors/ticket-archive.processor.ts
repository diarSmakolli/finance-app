import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-massage.entity';
import { TicketStatus } from '../ticket.service';
import { AppLoggerService } from '../../logger/logger.service';
import { Job } from 'bull';
import { User } from 'src/modules/users/entities/user.entity';
import { Notification } from 'src/modules/notifications/notification.entity';


@Injectable()
@Processor('tickets')
export class TicketArchiveProcessor {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketMessage)
        private messageRepository: Repository<TicketMessage>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        private readonly logger: AppLoggerService,
    ) {}

    @OnQueueActive()
    onActive(job: Job) {
        this.logger.log(
            `Processing job ${job.id} of type ${job.name}`,
            'TicketProcessor'
        );
    }

    @OnQueueCompleted()
    onComplete(job: Job, result: any) {
        this.logger.log(
            `Job ${job.id} completed. Archived ${result.archived} tickets`,
            'TicketProcessor'
        );
    }

    @OnQueueFailed()
    onError(job: Job<any>, error: any) {
        this.logger.error(
            `Failed job ${job.id}: ${error.message}`,
            error.stack,
            'Ticker processor'
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

            if(!inactiveTickets) {
                this.logger.log(`No inactive tickets has been found.`);
            }

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

    @Process('new-ticket-notification')
    async processNewTicketNotification(job: Job<{ ticketId: string; userId: string; department: string }>) {
        const start = performance.now();
        try {
            const { ticketId, userId, department } = job.data;

            
            const ticket = await this.ticketRepository.findOne({
                where: { id: ticketId },
                relations: ['user']
            });

            if (!ticket) {
                throw new Error(`Ticket not found: ${ticketId}`);
            }

            
            const adminUsers = await this.userRepository.find({
                where: {
                    role: In(['administration', 'sysadmin', 'infrastructure', 'wsadmin']),
                    isActive: true,
                    isBlocked: false
                }
            });

            
            const notifications = adminUsers.map(admin => 
                this.notificationRepository.create({
                    userId: admin.id,
                    title: 'New Support Ticket',
                    message: `New ticket #${ticket.id} created in ${department} department by ${ticket.user.firstName} 
                    ${ticket.user.lastName}`,
                    read: false,
                })
            );

            
            await this.notificationRepository.save(notifications);

            const end = performance.now();
            this.logger.log(
                `Created ${notifications.length} notifications for ticket ${ticketId} in ${(end - start).toFixed(2)}ms`,
                'TicketProcessor'
            );

            return {
                success: true,
                notificationsCreated: notifications.length,
                notifiedRoles: adminUsers.map(user => user.role),
                processingTime: `${(end - start).toFixed(2)}ms`
            };
        } catch (error) {
            this.logger.error(
                `Error creating ticket notifications: ${error.message}`,
                error.stack,
                'TicketProcessor'
            );
            throw error;
        }
    }

    @Process('ticket-assignment-notification')
    async processTicketAssignmentNotification(job: Job<{
        ticketId: string;
        managerId: string;
        assignedBy: string;
        department: string;
    }>) {
        const start = performance.now();
        try {
            const { ticketId, managerId, assignedBy, department } = job.data;

            const [ticket, manager, assigner] = await Promise.all([
                this.ticketRepository.findOne({
                    where: { id: ticketId },
                    relations: ['user'],
                    select: ['id', 'subject', 'department', 'user']
                }),
                this.userRepository.findOne({
                    where: { id: managerId },
                    select: ['id', 'firstName', 'lastName', 'email']
                }),
                this.userRepository.findOne({
                    where: { id: assignedBy },
                    select: ['id', 'firstName', 'lastName']
                })
            ]);


            if (!ticket || !manager || !assigner) {
                throw new Error('Required data not found');
            }

            const notifications = [
                {
                    userId: managerId,
                    title: 'New ticket Assignment',
                    message: `Ticket #${ticketId} has been assigned to you by ${assigner.firstName} ${assigner.lastName}`,
                    read: false,
                },
                // notify the client, creator of ticket.
                {
                    userId: ticket.user.id,
                    title: 'Ticket Update!',
                    message: `Your ticket #${ticketId} has been assigned to specific team and you will get a reply as soon as possible.`,
                    read: false,
                }
            ];

            await this.notificationRepository.save(notifications);

            const end = performance.now();

            this.logger.log(
                `Processed processTicketAssignmentNotification ${notifications.length} notifications for ticket ${ticketId} in ${(end - start).toFixed(2)}ms`,
                'TicketProcessor'
            );

            return {
                success: true,
                notificationsCreated: notifications.length,
                processingTime: `${(end - start).toFixed(2)}ms`
            };
        } catch(error) {
            this.logger.error(
                `Failed to process ticket assignment job in queue: ${error.message}`, 
                error.stack, 'TicketProcessor'
            );
            throw error;
        }
        
    }

    @Process('new-message-notification')
    async processNewReplyMessageNotification(job: Job<{
        ticketId: string;
        messageId: string;
        senderId: string;
        isFromClient: boolean;
        department: string
    }>) {
        const start = performance.now();
        try {
            const { ticketId, messageId, senderId, isFromClient, department } = job.data;

            const [ticket, message, sender] = await Promise.all([
                this.ticketRepository.findOne({
                    where: { id: ticketId },
                    relations: ['user', 'manager'],
                    select: ['id', 'subject', 'department', 'user', 'manager']
                }),
                this.messageRepository.findOne({
                    where: { id: messageId },
                    select: ['id', 'message', 'createdAt']
                }),
                this.userRepository.findOne({
                    where: { id: senderId },
                    select: ['id', 'firstName', 'lastName', 'role']
                })
            ]);
    
            if (!ticket || !message || !sender) {
                throw new Error('Required data not found');
            }

            interface NotificationData {
                userId: string;
                title: string;
                message: string;
                read: boolean;
            }

            let notifications: NotificationData[] = [];

            // 'administration', 'sysadmin', 'infrastructure', 'wsadmin'

            if (isFromClient) {
                // Client sent message - notify manager if assigned
                if (ticket.manager) {
                    notifications.push({
                        userId: ticket.manager.id,
                        title: 'New Message in Ticket',
                        message: `Client ${sender.firstName} ${sender.lastName} replied to ticket #${ticketId}`,
                        read: false
                    });
                } else {
                    // If no manager, notify all admins
                    const admins = await this.userRepository.find({
                        where: {
                            role: In(['administration', 'sysadmin']),
                            isActive: true,
                            isBlocked: false
                        },
                        select: ['id']
                    });
    
                    notifications.push(...admins.map(admin => ({
                        userId: admin.id,
                        title: 'New Message in Unassigned Ticket',
                        message: `New client message in unassigned ticket #${ticketId}`,
                        read: false
                    })));
                }
            } else {
                // Support agent sent message - notify client
                notifications.push({
                    userId: ticket.user.id,
                    title: 'Support Team Reply',
                    message: `Support team replied to your ticket #${ticketId}`,
                    read: false
                });
            }

            if (notifications.length > 0) {
                await this.notificationRepository
                    .createQueryBuilder()
                    .insert()
                    .into(Notification)
                    .values(notifications)
                    .execute();
            }
    
            const end = performance.now();
            this.logger.log(`
                message: 'Processed message notifications',
            }, 'TicketProcessor'`);
    
            return {
                success: true,
                notificationsCreated: notifications.length,
                processingTime: `${(end - start).toFixed(2)}ms`
            };
        } catch(error) {
            this.logger.error(
                `Failed to process queue: ${error.message}`, 
                error.stack, 'processNewReplyMessageNotification'
            );
            throw error;
        }

    }
    
}