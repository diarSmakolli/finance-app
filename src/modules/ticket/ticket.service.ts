import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-massage.entity';
import { User } from '../users/entities/user.entity';
import { AppLoggerService } from '../logger/logger.service';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

export enum TicketStatus {
    ACTIVE = 'ACTIVE',
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    ARCHIVED = 'ARCHIVED'
}

export enum Department {
    TECHNICAL = 'technical_support',
    CUSTOMER_CARE = 'customer_care'
}

@Injectable()
export class TicketService {
    constructor(
        @InjectQueue('tickets') private ticketsQueue: Queue,
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketMessage)
        private messageRepository: Repository<TicketMessage>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly logger: AppLoggerService
    ) {
        this.initializeQueue();
    }

    private async initializeQueue() {
        await this.ticketsQueue.clean(0, 'completed');
        await this.ticketsQueue.clean(0, 'failed');
        this.logger.log('Queue initialized and cleaned', 'TicketService');
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async scheduleInactiveTicketsCheck() {
        const start = performance.now();
        try {
            this.logger.log('Scheduling inactive tickets check', 'TicketService');

            // Check if job already exists
            const pendingJobs = await this.ticketsQueue.getJobs(['waiting', 'active']);
            if (pendingJobs.length > 0) {
                this.logger.debug('Archive job already in queue, skipping', 'TicketService');
                return;
            }

            const job = await this.ticketsQueue.add(
                'archive-inactive-tickets',
                {
                    timestamp: new Date(),
                    isAutomated: true
                },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 60000
                    },
                    removeOnComplete: true,
                    timeout: 300000 // 5 minutes timeout
                }
            );

            const end = performance.now();
            this.logger.log(
                `Created archive job with ID: ${job.id} in ${(end - start).toFixed(2)}ms`,
                'TicketService'
            );
        } catch (error) {
            this.logger.error(
                `Failed to schedule archive job: ${error.message}`,
                error.stack,
                'TicketService'
            );
        }
    }
    
    // DONE
    async createTicket(
        userId: string,
        data: {
            department: Department;
            category: string;
            subject: string;
            message: string;
        },
        files?: Express.Multer.File[]
    ): Promise<Ticket> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('Request failed at this time, please try again.');
        }

        if (user.isBlocked || !user.isActive || user.isSuspicious) {
            throw new NotFoundException('Request failed at this time, please try again.');
        }

        const ticket = this.ticketRepository.create({
            userId,
            department: data.department,
            category: data.category,
            subject: data.subject,
            status: TicketStatus.OPEN,
            lastMessageAt: new Date()
        });

        await this.ticketRepository.save(ticket);


        const attachments = files?.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: `uploads/tickets/${file.filename}`
        })) || [];

       
        const message = this.messageRepository.create({
            ticketId: ticket.id,
            senderId: user.id,
            message: data.message,
            attachments
        });

       
        await this.ticketsQueue.add(
            'new-ticket-notification',
            {
                ticketId: ticket.id,
                userId,
                department: data.department,
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 30000
                },
                removeOnComplete: true
            }
        );

        await this.messageRepository.save(message);

        this.logger.log(
            `New ticket created: ${ticket.id} with ${attachments.length} attachments`,
            'TicketService'
        );
        return ticket;
    }

    // DONE
    async assignManager(ticketId: string, managerId: string, currentUserId: string): Promise<Ticket> {
        this.logger.log(`Attempting to assign ticket ${ticketId} to support agent ${managerId}`, 'TicketService');

        if (!ticketId || !managerId || !currentUserId) {
            throw new BadRequestException('Request failed, please try again.');
        }

        const currentUser = await this.userRepository.findOne({
            where: { 
                id: currentUserId,
                role: In(['administration', 'sysadmin', 'infrastructure', 'wsadmin']), // Only these roles can assign
                isActive: true,
                isBlocked: false
            }
        });

        if(!currentUser) {
            throw new NotFoundException('No assignee found in our records.');
        }

        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['manager', 'user']
        });

        if (!ticket) {
            throw new NotFoundException('No ticket found in our records.');
        }

        if (ticket.status == 'RESOLVED' || ticket.status == 'ARCHIVED') {
            throw new NotFoundException('Ticket already resolved/archived.');
        }

        const manager = await this.userRepository.findOne({
            where: {
                id: managerId,
                role: In(['administration', 'sysadmin', 'infrastructure', 'wsadmin']),
                isActive: true,
                isBlocked: false,
                isSuspicious: false
            }
        });

        if (!manager) {
            throw new BadRequestException('No person for assign found in our records.');
        }

        ticket.manager = manager;
        ticket.managerId = manager.id;
        ticket.status = TicketStatus.IN_PROGRESS;
        ticket.lastMessageAt = new Date();

        // Create System Message
        const systemMessage = this.messageRepository.create({
            ticketId: ticket.id,
            senderId: currentUserId,
            message: `Ticket assigned to specified team, as soon as possible you will get an reply.`,
            isSystemMessage: true,
            systemMessageType: 'ASSIGNMENT',
            attachments: []
        });

        this.messageRepository.save(systemMessage);

        await this.ticketsQueue.add(
            'ticket-assignment-notification',
            {
                ticketId: ticket.id,
                managerId: manager.id,
                assignedBy: currentUserId,
                department: ticket.department
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 30000
                },
                removeOnComplete: true
            }
        );

        const updatedTicket = await this.ticketRepository.save(ticket);
        return updatedTicket;
    }

    // DONE
    async getTicketDetails(ticketId: string): Promise<Ticket> {
        if(!ticketId) {
            throw new BadRequestException('Request failed at this time, please try again.');
        }

        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['messages', 'messages.sender', 'manager', 'user']
        });

        if (!ticket) {
            throw new NotFoundException('No ticket found in our records, please try again.');
        }

        return ticket;
    }

    // IN PROCESS
    async addMessage(
        ticketId: string,
        senderId: string,
        data: {
            message: string
        },
        files?: Express.Multer.File[]
    ): Promise<TicketMessage> {
        this.logger.log(`Adding message to ticket ${ticketId} by user ${senderId}`, 'TicketService');

        if (!ticketId) {
            throw new BadRequestException('Request failed, please try again later.');
        }

        // Find ticket with all necessary relations
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['messages', 'user', 'manager']
        });

        if (!ticket) {
            throw new NotFoundException('No ticket founded in our records.');
        }

        // Check if user is authorized to add message
        if (ticket.userId !== senderId && ticket.managerId !== senderId) {
            throw new UnauthorizedException('You are not authorized to reply to this ticket.');
        }

        // Process attachments if any
        const attachments = files?.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: `uploads/tickets/${file.filename}`
        })) || [];

        const message = this.messageRepository.create({
            ticket, // Add full ticket relation
            ticketId,
            senderId,
            message: data.message,
            attachments
        });

        const savedMessage = await this.messageRepository.save(message);

        // Update ticket's last message timestamp
        await this.ticketRepository.update(ticketId, {
            lastMessageAt: new Date()
        });


        // add to queue
        await this.ticketsQueue.add(
            `new-message-notification`,
            {
                ticketId,
                messageId: message.id,
                senderId,
                isFromClient: ticket.userId === senderId,
                department: ticket.department
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 30000,
                },
                removeOnComplete: true
            }
        );

        this.logger.log(
            `Message ${savedMessage.id} added to ticket ${ticketId} by user ${senderId} with ${attachments.length} attachments`,
            'TicketService'
        );

        return savedMessage;
    }

    async reassignTicket(
        ticketId: string,
        newAssigneeId: string,
        currentUserId: string,
        data: {
            reason?: string;
            priority?: boolean;
        } = {}
    ): Promise<any> {
        this.logger.log(
            `Attempting to reassign ticket ${ticketId} to support agent ${newAssigneeId}`,
            'TicketService'
        );

        if (!newAssigneeId) {
            throw new BadRequestException('Request failed.');
        }

        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['manager', 'user', 'messages']
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        if (ticket.status == 'resolved') {
            throw new UnauthorizedException('Ticket already has been resolved.');
        }

        // Verify new assignee exists and is available
        const newAssignee = await this.userRepository.findOne({
            where: {
                id: newAssigneeId,
                isActive: true,
                isBlocked: false,
                isSuspicious: false
            }
        });

        if (!newAssignee) {
            throw new BadRequestException('New assignee not found or not available');
        }

        // Don't reassign to same person
        if (ticket.managerId === newAssigneeId) {
            throw new BadRequestException('Ticket is already assigned to this same person.');
        }

        const oldAssigneeId = ticket.managerId;
        const oldAssigneeName = ticket.manager ?
            `${ticket.manager.firstName} ${ticket.manager.lastName}` :
            'Unassigned';

        // Update ticket assignment
        ticket.manager = newAssignee;
        ticket.managerId = newAssigneeId;

        if (data.priority) {
            ticket.status = TicketStatus.IN_PROGRESS;
        }

        // Create system message for the reassignment
        // const systemMessage = this.messageRepository.create({
        //     ticketId: ticket.id,
        //     senderId: currentUserId,
        //     message: `Ticket reassigned from ${oldAssigneeName} to ${newAssignee.firstName} ${newAssignee.lastName}${
        //         data.reason ? `\nReason: ${data.reason}` : ''
        //     }${
        //         data.priority ? '\nMarked as HIGH PRIORITY' : ''
        //     }`,
        //     isSystemMessage: true,
        //     systemMessageType: 'REASSIGNMENT',
        //     attachments: []
        // });

        // await this.messageRepository.save(systemMessage);

        // Update ticket's last message timestamp and save
        ticket.lastMessageAt = new Date();
        const updatedTicket = await this.ticketRepository.save(ticket);

        this.logger.log(
            `Ticket ${ticketId} successfully reassigned from ${oldAssigneeId} to ${newAssigneeId}`,
            'TicketService'
        );

        return {
            status: 'success',
            code: '200',
            message: 'Ticket reassigned successfully',
            data: {
                ticket: updatedTicket
            }
        }
    }

    async previewAttachment(
        ticketId: string,
        messageId: string,
        filename: string,
        userId: string
    ): Promise<{
        file: StreamableFile;
        mimeType: string;
        filename: string;
    }> {
        this.logger.log(
            `Attempting to preview attachment ${filename} from message ${messageId} in ticket ${ticketId}`,
            'TicketService'
        );

        // Find the ticket and verify access
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['messages']
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Check authorization
        if (ticket.userId !== userId && ticket.managerId !== userId) {
            throw new UnauthorizedException('Not authorized to view this attachment');
        }

        // Find the message
        const message = await this.messageRepository.findOne({
            where: { id: messageId, ticketId }
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Find the attachment in the message
        const attachment = message.attachments?.find(a => a.filename === filename);

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        // Get the full file path
        const filePath = join(process.cwd(), attachment.path);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found on server');
        }

        // Create a readable stream
        const file = fs.createReadStream(filePath);

        this.logger.log(
            `Successfully streaming attachment ${filename} from message ${messageId}`,
            'TicketService'
        );

        return {
            file: new StreamableFile(file),
            mimeType: attachment.mimeType,
            filename: attachment.originalName
        };
    }

    async downloadAttachment(
        ticketId: string,
        messageId: string,
        filename: string,
        userId: string
    ): Promise<{
        file: StreamableFile;
        mimeType: string;
        filename: string;
    }> {
        this.logger.log(
            `Attempting to download attachment ${filename} from message ${messageId} in ticket ${ticketId}`,
            'TicketService'
        );

        // Reuse the same logic as preview since the validation and file retrieval is identical
        return await this.previewAttachment(ticketId, messageId, filename, userId);
    }

    async listTickets(options: {
        page?: number;
        limit?: number;
        search?: string;
        status?: TicketStatus;
        department?: Department;
        userId?: string;
        managerId?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<{
        tickets: Ticket[];
        total: number;
        pages: number;
        currentPage: number;
    }> {

        const {
            page = 1,
            limit = 10,
            search,
            status,
            department,
            userId,
            managerId,
            dateFrom,
            dateTo,
            sortBy = 'lastMessageAt',
            sortOrder = 'DESC'
        } = options;

        const queryBuilder = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.user', 'user')
            .leftJoinAndSelect('ticket.manager', 'manager')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('messages.sender', 'sender');

        // Apply search filter
        if (search) {
            queryBuilder.andWhere(
                '(ticket.subject ILIKE :search OR ticket.category ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Apply status filter
        if (status) {
            queryBuilder.andWhere('ticket.status = :status', { status });
        }

        // Apply department filter
        if (department) {
            queryBuilder.andWhere('ticket.department = :department', { department });
        }

        // Apply user filter
        if (userId) {
            queryBuilder.andWhere('ticket.userId = :userId', { userId });
        }

        // Apply manager filter
        if (managerId) {
            queryBuilder.andWhere('ticket.managerId = :managerId', { managerId });
        }

        // Apply date range filter
        if (dateFrom) {
            queryBuilder.andWhere('ticket.createdAt >= :dateFrom', {
                dateFrom: new Date(dateFrom)
            });
        }

        if (dateTo) {
            queryBuilder.andWhere('ticket.createdAt <= :dateTo', {
                dateTo: new Date(dateTo)
            });
        }

        // Get total count for pagination
        const total = await queryBuilder.getCount();

        // Apply sorting
        if (sortBy && sortOrder) {
            queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);
        }

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const tickets = await queryBuilder.getMany();

        this.logger.log(
            `Retrieved ${tickets.length} tickets (page ${page}/${Math.ceil(total / limit)})`,
            'TicketService'
        );

        return {
            tickets,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    async updateTicketStatus(
        ticketId: string,
        managerId: string,
        data: {
            status: TicketStatus;
            comment?: string;
        }
    ): Promise<Ticket> {
        this.logger.log(
            `Attempting to update ticket ${ticketId} status to ${data.status}`,
            'TicketService'
        );

        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['manager', 'user', 'messages']
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Verify the manager is assigned to this ticket
        if (ticket.managerId !== managerId) {
            throw new UnauthorizedException(
                'Only the assigned manager can update ticket status'
            );
        }

        // Don't allow status change if already archived
        if (ticket.status === TicketStatus.ARCHIVED) {
            throw new BadRequestException('Cannot update status of archived ticket');
        }

        const oldStatus = ticket.status;
        ticket.status = data.status;
        ticket.lastMessageAt = new Date();

        // Create system message for status change
        // const systemMessage = this.messageRepository.create({
        //     ticketId: ticket.id,
        //     senderId: managerId,
        //     message: `Ticket status changed from ${oldStatus} to ${data.status}${
        //         data.comment ? `\nComment: ${data.comment}` : ''
        //     }`,
        //     isSystemMessage: true,
        //     systemMessageType: 'STATUS_CHANGE',
        //     attachments: []
        // });

        // await this.messageRepository.save(systemMessage);

        // Save ticket changes
        const updatedTicket = await this.ticketRepository.save(ticket);

        this.logger.log(
            `Successfully updated ticket ${ticketId} status from ${oldStatus} to ${data.status}`,
            'TicketService'
        );

        return updatedTicket;
    }

    async getClientTickets(
        userId: string,
        options: {
            page?: number;
            limit?: number;
            status?: string[];
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        } = {}
    ): Promise<{
        tickets: Ticket[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const {
            page = 1,
            limit = 10,
            status = [TicketStatus.ACTIVE, TicketStatus.IN_PROGRESS, TicketStatus.OPEN],
            sortBy = 'lastMessageAt',
            sortOrder = 'DESC'
        } = options;

        const queryBuilder = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('ticket.manager', 'manager')
            .leftJoinAndSelect('messages.sender', 'sender')
            .where('ticket.userId = :userId', { userId });

        // Handle status filter with proper type checking
        const validStatuses = (Array.isArray(status) ? status : [status])
            .filter((s): s is string => typeof s === 'string')
            .map(s => s.toUpperCase())
            .filter((s): s is TicketStatus =>
                Object.values(TicketStatus).includes(s as TicketStatus)
            );

        if (validStatuses.length > 0) {
            queryBuilder.andWhere('UPPER(ticket.status) IN (:...statuses)', {
                statuses: validStatuses
            });

            this.logger.log(
                `Filtering tickets by status: ${validStatuses.join(', ')}`,
                'TicketService'
            );
        }

        // Get total count for pagination
        const total = await queryBuilder.getCount();

        if (total === 0) {
            throw new NotFoundException(
                `No tickets found with status: ${validStatuses.join(', ')}`
            );
        }

        // Apply sorting
        queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const tickets = await queryBuilder.getMany();

        return {
            tickets,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    async getClientArchivedTickets(
        userId: string,
        options: {
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        } = {}
    ): Promise<{
        tickets: Ticket[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'lastMessageAt',
            sortOrder = 'DESC'
        } = options;

        const queryBuilder = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('ticket.manager', 'manager')
            .leftJoinAndSelect('messages.sender', 'sender')
            .where('ticket.userId = :userId', { userId })
            .andWhere('UPPER(ticket.status) IN (:...statuses)', {
                statuses: [TicketStatus.RESOLVED, TicketStatus.ARCHIVED]
            });

        // Get total count
        const total = await queryBuilder.getCount();

        if (total === 0) {
            throw new NotFoundException('No archived tickets found');
        }

        // Apply sorting
        queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const tickets = await queryBuilder.getMany();

        return {
            tickets,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    async getAssignedTickets(
        managerId: string,
        options: {
            page?: number;
            limit?: number;
            status?: TicketStatus[];
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        } = {}
    ): Promise<{
        tickets: Ticket[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const {
            page = 1,
            limit = 10,
            status = [TicketStatus.ACTIVE, TicketStatus.IN_PROGRESS, TicketStatus.OPEN],
            sortBy = 'lastMessageAt',
            sortOrder = 'DESC'
        } = options;

        const queryBuilder = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('ticket.user', 'user')
            .leftJoinAndSelect('messages.sender', 'sender')
            .where('ticket.managerId = :managerId', { managerId });

        // Handle status filter
        if (status.length > 0) {
            queryBuilder.andWhere('UPPER(ticket.status) IN (:...statuses)', {
                statuses: status.map(s => s.toUpperCase())
            });

            this.logger.log(
                `Filtering assigned tickets by status: ${status.join(', ')}`,
                'TicketService'
            );
        }

        // Get total count for pagination
        const total = await queryBuilder.getCount();

        if (total === 0) {
            throw new NotFoundException(
                `No tickets assigned to you${status.length > 0 ? ` with status: ${status.join(', ')}` : ''}`
            );
        }

        // Apply sorting
        queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const tickets = await queryBuilder.getMany();

        this.logger.log(
            `Retrieved ${tickets.length} assigned tickets for manager ${managerId}`,
            'TicketService'
        );

        return {
            tickets,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    async getUnassignedTickets(
        options: {
            page?: number;
            limit?: number;
            department?: Department;
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        } = {}
    ): Promise<{
        tickets: Ticket[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const {
            page = 1,
            limit = 10,
            department,
            sortBy = 'createdAt',
            sortOrder = 'ASC' // Show oldest first by default
        } = options;

        const queryBuilder = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('ticket.user', 'user')
            .leftJoinAndSelect('messages.sender', 'sender')
            .where('ticket.managerId IS NULL') // Get tickets with no manager assigned
            .andWhere('ticket.status IN (:...statuses)', {
                statuses: [TicketStatus.ACTIVE, TicketStatus.OPEN, TicketStatus.IN_PROGRESS] // Only show active/open tickets
            });

        // Apply department filter if provided
        if (department) {
            queryBuilder.andWhere('ticket.department = :department', { department });
            this.logger.log(
                `Filtering unassigned tickets by department: ${department}`,
                'TicketService'
            );
        }

        // Get total count for pagination
        const total = await queryBuilder.getCount();

        if (total === 0) {
            throw new NotFoundException(
                `No unassigned tickets found${department ? ` in ${department} department` : ''}`
            );
        }

        // Apply sorting
        queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const tickets = await queryBuilder.getMany();

        this.logger.log(
            `Retrieved ${tickets.length} unassigned tickets${department ? ` from ${department} department` : ''}`,
            'TicketService'
        );

        return {
            tickets,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    async getOpenTickets(
        options: {
            page?: number;
            limit?: number;
            department?: Department;
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        } = {}
    ): Promise<{
        tickets: Ticket[];
        total: number;
        pages: number;
        currentPage: number;
    }> {
        const {
            page = 1,
            limit = 10,
            department,
            sortBy = 'createdAt',
            sortOrder = 'ASC' // Show oldest first by default
        } = options;

        const queryBuilder = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('ticket.user', 'user')
            .leftJoinAndSelect('ticket.manager', 'manager')
            .leftJoinAndSelect('messages.sender', 'sender')
            .where('ticket.status = :status', { status: TicketStatus.OPEN });

        // Apply department filter if provided
        if (department) {
            queryBuilder.andWhere('ticket.department = :department', { department });
            this.logger.log(
                `Filtering open tickets by department: ${department}`,
                'TicketService'
            );
        }

        // Get total count for pagination
        const total = await queryBuilder.getCount();

        if (total === 0) {
            throw new NotFoundException(
                `No open tickets found${department ? ` in ${department} department` : ''}`
            );
        }

        // Apply sorting
        queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const tickets = await queryBuilder.getMany();

        this.logger.log(
            `Retrieved ${tickets.length} open tickets${department ? ` from ${department} department` : ''}`,
            'TicketService'
        );

        return {
            tickets,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }
}
