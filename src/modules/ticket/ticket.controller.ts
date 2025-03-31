import { Controller, Post, Get, Put, Body, Param, UseGuards, Req, UseInterceptors, UploadedFiles, Res } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { TicketService, TicketStatus, Department } from './ticket.service';
import { AuthGuard } from '../auth/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('support-tickets')
@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('attachments', 5))
    async createTicket(
        @Req() req: any,
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() data: {
            department: Department;
            category: string;
            subject: string;
            message: string;
        }
    ) {
        const ticket = await this.ticketService.createTicket(req.user.id, data, files);
        return {
            status: 'success',
            code: '201',
            message: 'Ticket created successfully',
            data: { ticket }
        };
    }

    @Put(':id/assign')
    @ApiOperation({ summary: 'Assign ticket to support agent' })
    async assignTicket(
        @Param('id') ticketId: string,
        @Body() data: { managerId: string }
    ) {
        const ticket = await this.ticketService.assignManager(ticketId, data.managerId);
        return {
            status: 'success',
            message: 'Ticket assigned successfully',
            data: { ticket }
        };
    }

    @Get('/:ticketId')
    @ApiOperation({ summary: 'Get ticket details' })
    async getTicketDetails(
        @Param('ticketId') ticketId: string,
    ) {
        const ticket = await this.ticketService.getTicketDetails(ticketId);
        return {
            status: 'success',
            code: '200',
            message: 'Ticket details retrieved successfully.',
            data: {
                ticket: ticket
            }
        }
    }

    @Post(':id/messages')
    @ApiOperation({ summary: 'Add message to ticket' })
    @UseInterceptors(FilesInterceptor('attachments', 5))
    @ApiConsumes('multipart/form-data')
    async addMessage(
        @Param('id') ticketId: string,
        @Req() req: any,
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() data: { message: string }
    ) {
        const message = await this.ticketService.addMessage(
            ticketId,
            req.user.id, // Use authenticated user's ID instead of path parameter
            data,
            files
        );

        return {
            status: 'success',
            code: '201',
            message: 'Message added successfully',
            data: { message }
        };
    }

    @Put(':id/reassign')
    @ApiOperation({ summary: 'Reassign ticket to different support agent' })
    @ApiResponse({ status: 200, description: 'Ticket reassigned successfully' })
    async reassignTicket(
        @Param('id') ticketId: string,
        @Body() data: {
            newAssigneeId: string;
            currentUserId: string;
            reason?: string;
            priority?: boolean;
        },
        @Req() req: any
    ) {
        const ticket = await this.ticketService.reassignTicket(
            ticketId,
            data.newAssigneeId,
            data.currentUserId,
            {
                reason: data.reason,
                priority: data.priority
            }
        );
    
        return ticket;
    }

    

}