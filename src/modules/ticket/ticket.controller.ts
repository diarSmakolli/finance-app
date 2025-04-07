import { Controller, Post, Get, Put, Body, Param, UseGuards, Req, UseInterceptors, UploadedFiles, Res, StreamableFile, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { TicketService, TicketStatus, Department } from './ticket.service';
import { AuthGuard } from '../auth/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('support-tickets')
@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('attachments', 5))
    @UseGuards(AuthGuard)
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

    @Get('my-tickets')
    @ApiOperation({ summary: 'Get active tickets for the authenticated client' })
    @ApiResponse({ status: 200, description: 'Active tickets retrieved successfully' })
    async getMyTickets(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string[],
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        const result = await this.ticketService.getClientTickets(
            req.user.id,
            {
                page,
                limit,
                status: Array.isArray(status) ? status : status ? [status] : undefined,
                sortBy,
                sortOrder
            }
        );

        return {
            status: 'success',
            code: '200',
            message: 'Your tickets retrieved successfully',
            data: {
                tickets: result.tickets,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    currentPage: result.currentPage,
                    limit: limit || 10
                }
            }
        };
    }

    @Get('my-tickets/archived')
    @ApiOperation({ summary: 'Get archived tickets for the authenticated client' })
    @ApiResponse({ status: 200, description: 'Archived tickets retrieved successfully' })
    async getMyArchivedTickets(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        const result = await this.ticketService.getClientArchivedTickets(
            req.user.id,
            {
                page,
                limit,
                sortBy,
                sortOrder
            }
        );

        return {
            status: 'success',
            code: '200',
            message: 'Your archived tickets retrieved successfully',
            data: {
                tickets: result.tickets,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    currentPage: result.currentPage,
                    limit: limit || 10
                }
            }
        };
    }

    @Get('assigned-to-me')
    @ApiOperation({ summary: 'Get tickets assigned to the authenticated manager' })
    @ApiResponse({ status: 200, description: 'Assigned tickets retrieved successfully' })
    async getAssignedTickets(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: TicketStatus[],
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        const result = await this.ticketService.getAssignedTickets(
            req.user.id,
            {
                page,
                limit,
                status,
                sortBy,
                sortOrder
            }
        );

        return {
            status: 'success',
            code: '200',
            message: 'Your assigned tickets retrieved successfully',
            data: {
                tickets: result.tickets,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    currentPage: result.currentPage,
                    limit: limit || 10
                }
            }
        };
    }

    @Get('unassigned')
    @ApiOperation({ summary: 'Get all unassigned tickets' })
    @ApiResponse({ status: 200, description: 'Unassigned tickets retrieved successfully' })
    async getUnassignedTickets(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('department') department?: Department,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        const result = await this.ticketService.getUnassignedTickets({
            page,
            limit,
            department,
            sortBy,
            sortOrder
        });

        return {
            status: 'success',
            code: '200',
            message: 'Unassigned tickets retrieved successfully',
            data: {
                tickets: result.tickets,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    currentPage: result.currentPage,
                    limit: limit || 10
                }
            }
        };
    }

    @Get('open')
    @ApiOperation({ summary: 'Get all open tickets' })
    @ApiResponse({ status: 200, description: 'Open tickets retrieved successfully' })
    async getOpenTickets(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('department') department?: Department,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        const result = await this.ticketService.getOpenTickets({
            page,
            limit,
            department,
            sortBy,
            sortOrder
        });

        return {
            status: 'success',
            code: '200',
            message: 'Open tickets retrieved successfully',
            data: {
                tickets: result.tickets,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    currentPage: result.currentPage,
                    limit: limit || 10
                }
            }
        };
    }

   
    @Get()
    @ApiOperation({ summary: 'List tickets with pagination and filters' })
    @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
    async listTickets(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('status') status?: TicketStatus,
        @Query('department') department?: Department,
        @Query('userId') userId?: string,
        @Query('managerId') managerId?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ) {
        const result = await this.ticketService.listTickets({
            page,
            limit,
            search,
            status,
            department,
            userId,
            managerId,
            dateFrom,
            dateTo,
            sortBy,
            sortOrder
        });

        return {
            status: 'success',
            code: '200',
            message: 'Tickets retrieved successfully',
            data: {
                tickets: result.tickets,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    currentPage: result.currentPage,
                    limit: limit || 10
                }
            }
        };
    }

    @Put(':id/assign')
    @ApiOperation({ summary: 'Assign ticket to support agent' })
    async assignTicket(
        @Param('id') ticketId: string,
        @Body() data: { managerId: string },
        @Req() req: any,
    ) {
        const ticket = await this.ticketService.assignManager(ticketId, data.managerId, req.user.id);
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
            req.user.id,
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

    @Get(':ticketId/messages/:messageId/attachments/:filename')
    @ApiOperation({ summary: 'Preview ticket message attachment' })
    @ApiResponse({ status: 200, description: 'File streamed successfully' })
    async previewAttachment(
        @Param('ticketId') ticketId: string,
        @Param('messageId') messageId: string,
        @Param('filename') filename: string,
        @Req() req: any,
        @Res({ passthrough: true }) response: Response
    ): Promise<StreamableFile> {
        const { file, mimeType, filename: originalName } =
            await this.ticketService.previewAttachment(
                ticketId,
                messageId,
                filename,
                req.user.id
            );

        response.set({
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${originalName}"`,
            'Cache-Control': 'max-age=3600'
        });

        return file;
    }

    @Get(':ticketId/messages/:messageId/attachments/:filename/download')
    @ApiOperation({ summary: 'Download ticket message attachment' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully' })
    async downloadAttachment(
        @Param('ticketId') ticketId: string,
        @Param('messageId') messageId: string,
        @Param('filename') filename: string,
        @Req() req: any,
        @Res({ passthrough: true }) response: Response
    ): Promise<StreamableFile> {
        const { file, mimeType, filename: originalName } =
            await this.ticketService.downloadAttachment(
                ticketId,
                messageId,
                filename,
                req.user.id
            );

        response.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${originalName}"`,
            'Cache-Control': 'no-cache'
        });

        return file;
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update ticket status' })
    @ApiResponse({ status: 200, description: 'Ticket status updated successfully' })
    async updateTicketStatus(
        @Param('id') ticketId: string,
        @Body() data: {
            status: TicketStatus;
            comment?: string;
        },
        @Req() req: any
    ) {
        const updatedTicket = await this.ticketService.updateTicketStatus(
            ticketId,
            req.user.id,
            data
        );

        return {
            status: 'success',
            code: '200',
            message: 'Ticket status updated successfully',
            data: {
                ticket: updatedTicket
            }
        };
    }

}