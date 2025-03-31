import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-massage.entity';
import { User } from '../users/entities/user.entity';
import { AppLoggerService } from '../logger/logger.service';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export enum TicketStatus {
    ACTIVE = 'active',
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    ARCHIVED = 'archived'
}

export enum Department {
    TECHNICAL = 'technical_support',
    CUSTOMER_CARE = 'customer_care'
}

@Injectable()
export class TicketService {

    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketMessage)
        private messageRepository: Repository<TicketMessage>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly logger: AppLoggerService
    ) { }

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
            throw new NotFoundException('Request failed, try again later.');
        }

        const ticket = this.ticketRepository.create({
            userId,
            department: data.department,
            category: data.category,
            subject: data.subject,
            status: TicketStatus.ACTIVE,
            lastMessageAt: new Date()
        });

        await this.ticketRepository.save(ticket);

        // Process attachments if any
        const attachments = files?.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: `uploads/tickets/${file.filename}` // Updated path
        })) || [];

        // Create initial message with attachments
        const message = this.messageRepository.create({
            ticketId: ticket.id,
            senderId: userId,
            message: data.message,
            attachments
        });

        await this.messageRepository.save(message);

        this.logger.log(
            `New ticket created: ${ticket.id} with ${attachments.length} attachments`,
            'TicketService'
        );
        return ticket;
    }

    async assignManager(ticketId: string, managerId: string): Promise<Ticket> {
        this.logger.log(`Attempting to assign ticket ${ticketId} to support agent ${managerId}`, 'TicketService');

        if(!ticketId || !managerId) {
            throw new BadRequestException('Request failed, please try again.');
        }

        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['manager', 'user']
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        if(ticket.status == 'resolved' || ticket.status == 'archived') {
            throw new NotFoundException('Ticket already solved.');
        }

        const manager = await this.userRepository.findOne({
            where: {
                id: managerId,
                isActive: true,
                isBlocked: false,
                isSuspicious: false
            }
        });

        if (!manager) {
            throw new BadRequestException('Support agent not found or not available');
        }

        ticket.manager = manager;
        ticket.managerId = manager.id;
        ticket.status = TicketStatus.IN_PROGRESS;

        const updatedTicket = await this.ticketRepository.save(ticket);
        return updatedTicket;
    }

    async getTicketDetails(ticketId: string): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['messages', 'messages.sender', 'manager', 'user']
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        return ticket;
    }

    async addMessage(
        ticketId: string, 
        senderId: string,
        data: {
            message: string
        },
        files?: Express.Multer.File[]
    ): Promise<TicketMessage> {
        this.logger.log(`Adding message to ticket ${ticketId} by user ${senderId}`, 'TicketService');
    
        if(!ticketId) {
            throw new BadRequestException('Request failed, please try again later.');
        }
    
        // Find ticket with all necessary relations
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['messages', 'user', 'manager']
        });
    
        if(!ticket) {
            throw new NotFoundException('Request failed...');
        }
    
        // Check if user is authorized to add message
        if(ticket.userId !== senderId && ticket.managerId !== senderId) {
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

        if(!newAssigneeId) {
            throw new BadRequestException('Request failed.');
        }
    
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['manager', 'user', 'messages']
        });
    
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        if(ticket.status == 'resolved') {
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


}

// CREATE TICKET - DONE
// ASSIGN TICKET TO MANAGER OR REASSIGN ITSELF - DONE
// GET TICKET DETAILS - DONE
// REPLY TO A TICKET - DONE
// REASSIGN TICKET - DONE
// READ ATTACHMENT - PROGRESS
// DOWNLOAD ATTACHMENT - PROGRESS
// CHANGE TICKET STATUS
// GET ALL TICKETS
// GET ALL TICKETS TO A CLIENT
// GET ALL TICKETS ASSIGNED TO ME
// GET ALL UNASSIGNED TICKETS
// GET ALL INCIDENTS
// ISSUE TYPE: IT HELP, REQUEST OF CHANGE, REPORT AN INCIDENT, REQUEST NEW ACCOUNT, PROBLEM
// MOVE TICKET TO ARCHIVE TICKETS AS REFERENCE
// AFTER 1 MONTH AUTOMATICALLY MOVE TICKET TO ARCHIVE
// ALL OPEN TICKETS
