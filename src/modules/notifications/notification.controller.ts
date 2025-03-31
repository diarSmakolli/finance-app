import { Controller, Get, Param, Post, UseGuards, Req, Query, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get('/:userId')
    @ApiResponse({
        status: 200,
        description: 'Get all notifications for the user'
    })
    @UseGuards(AuthGuard)
    async getAllNotifications(@Req() req: Request, @Param('userId') userId: string) {
        const notifications = await this.notificationService.getAllByUserId(userId);
        return notifications;
    }

    @Get('/:userId/unread/count')
    @ApiResponse({
        status: 200,
        description: 'Get unread notifications count'
    })
    @UseGuards(AuthGuard)
    async getUnreadCount(@Req() req: Request, @Param('userId') userId: string) {
        const count = await this.notificationService.getUnReadNotificationsNumber(userId);
        return count;
    }

    @Get('/:userId/recent')
    @ApiResponse({
        status: 200,
        description: 'Get recent notifications'
    })
    @UseGuards(AuthGuard)
    async getRecentNotifications(
        @Req() req: Request,
        @Query('limit') limit: number,
        @Param('userId') userId: string,
    ) {
        
        const notifications = await this.notificationService.getRecentNotifications(userId, limit);
        return notifications;
    }

    @Get(':uid/:id')
    @ApiResponse({
        status: 200,
        description: 'Get notification details'
    })
    @UseGuards(AuthGuard)
    async getNotificationDetails(
        @Req() req: Request,
        @Param('id') notificationId: string,
        @Param('uid') userId: string,
    ) {
        const notification = await this.notificationService.getNotificationDetails(userId, notificationId);
        return notification;
    }

    @Put(':uid/:id/read')
    @ApiResponse({
        status: 200,
        description: 'Mark notification as read'
    })
    async markAsRead(
        @Req() req: Request,
        @Param('id') notificationId: string,
        @Param('uid') userId: string,
    ) {
        const notification = await this.notificationService.markAsRead(userId, notificationId);
        return notification;
    }

    @Put('/:uid/read-all')
    @ApiResponse({
        status: 200,
        description: 'Mark all notifications as read'
    })
    async markAllAsRead(@Req() req: Request, @Param('uid') userId: string) {
        const markAll = await this.notificationService.markAllAsRead(userId);
        return markAll;
    }
}
