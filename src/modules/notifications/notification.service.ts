import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        private readonly logger: AppLoggerService
    ) {}

    async getAllByUserId(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<any> {
        this.logger.log(
            `Fetching notifications for user ${userId} (page: ${page}, limit: ${limit})`,
            'NotificationService.getAllByUserId'
        );
    
        if(!userId) {
            this.logger.warn('Invalid userId provided', 'NotificationService.getAllByUserId');
            throw new BadRequestException('Request failed at this time, please try again later.');
        }
    
        // Calculate skip for pagination
        const skip = (page - 1) * limit;
    
        // Get total count for pagination
        const total = await this.notificationRepository.count({
            where: { userId }
        });
    
        this.logger.log(
            `Found total of ${total} notifications for user ${userId}`,
            'NotificationService.getAllByUserId'
        );
    
        const notifications = await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip,
            take: limit
        });
    
        if(!notifications.length) {
            this.logger.warn(
                `No notifications found for user ${userId} on page ${page}`,
                'NotificationService.getAllByUserId'
            );
            throw new NotFoundException('No notifications founded in our records.');
        }
    
        const totalPages = Math.ceil(total / limit);
    
        this.logger.log(
            `Retrieved ${notifications.length} notifications for user ${userId} (page ${page}/${totalPages})`,
            'NotificationService.getAllByUserId'
        );
    
        return {
            status: 'success',
            code: '200',
            message: 'Notifications retrieved successfully.',
            data: { 
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            }
        };
    }

    async getUnReadNotificationsNumber(userId: string): Promise<any> {
        this.logger.log(
            `Getting unread notifications count for user ${userId}`,
            'NotificationService.getUnReadNotificationsNumber'
        );

        if(!userId) {
            this.logger.warn(
                'Invalid userId provided',
                'NotificationService.getUnReadNotificationsNumber'
            );
            throw new BadRequestException('Request failed at this time, please try again later.');
        }

        const unreadCount = await this.notificationRepository.count({
            where: { userId, read: false }
        });

        this.logger.log(
            `Found ${unreadCount} unread notifications for user ${userId}`,
            'NotificationService.getUnReadNotificationsNumber'
        );

        return {
            status: 'success',
            code: '200',
            message: 'Unread notifications count retrieved successfully.',
            data: { 
                unreadCount 
            }
        };
    }

    async getRecentNotifications(userId: string, limit: number = 5): Promise<any> {
        this.logger.log(
            `Fetching ${limit} recent notifications for user ${userId}`,
            'NotificationService.getRecentNotifications'
        );
    
        if (!userId) {
            this.logger.warn(
                'Invalid userId provided',
                'NotificationService.getRecentNotifications'
            );
            throw new BadRequestException('Request failed at this time, please try again later.');
        }
    
        const notifications = await this.notificationRepository.find({
            where: { userId },
            order: {
                createdAt: 'DESC'
            },
            take: limit
        });
    
        if (!notifications.length) {
            this.logger.warn(
                `No recent notifications found for user ${userId}`,
                'NotificationService.getRecentNotifications'
            );
            throw new NotFoundException('No recent notifications founded in our records.');
        }
    
        this.logger.log(
            `Retrieved ${notifications.length} recent notifications for user ${userId}`,
            'NotificationService.getRecentNotifications'
        );
    
        return {
            status: 'success',
            code: '200',
            message: 'Recent notifications retrieved successfully.',
            data: {
                notifications,
                count: notifications.length
            }
        };
    }

    async getNotificationDetails(userId: string, notificationId: string): Promise<any> {
        this.logger.log(
            `Fetching notification details for ID ${notificationId} (user: ${userId})`,
            'NotificationService.getNotificationDetails'
        );
    
        if (!userId) {
            this.logger.warn(
                'Invalid userId provided',
                'NotificationService.getNotificationDetails'
            );
            throw new BadRequestException('Request failed at this time, please try again.');
        }
    
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });
    
        if (!notification) {
            this.logger.warn(
                `Notification ${notificationId} not found for user ${userId}`,
                'NotificationService.getNotificationDetails'
            );
            throw new NotFoundException('No notification founded in our records.');
        }
    
        this.logger.log(
            `Retrieved notification details for ID ${notificationId}`,
            'NotificationService.getNotificationDetails'
        );
    
        return {
            status: 'success',
            code: '200',
            message: 'Notification details retrieved successfully.',
            data: {
                notification
            }
        }
    }

    async markAsRead(userId: string, notificationId: string): Promise<any> {
        this.logger.log(
            `Attempting to mark notification ${notificationId} as read for user ${userId}`,
            'NotificationService.markAsRead'
        );
    
        if (!userId) {
            this.logger.warn(
                'Invalid userId provided',
                'NotificationService.markAsRead'
            );
            throw new BadRequestException('Request failed at this time, please try again later.');
        }
    
        // First find the notification
        const notification = await this.notificationRepository.findOne({
            where: { 
                id: notificationId,
                userId 
            }
        });
    
        if (!notification) {
            this.logger.warn(
                `Notification ${notificationId} not found for user ${userId}`,
                'NotificationService.markAsRead'
            );
            throw new NotFoundException('No notification founded in our records.');
        }
    
        // Only update if notification is not already read
        if (!notification.read) {
            this.logger.log(
                `Marking notification ${notificationId} as read`,
                'NotificationService.markAsRead'
            );
            
            await this.notificationRepository.update(
                { id: notificationId },
                { read: true }
            );
    
            this.logger.log(
                `Successfully marked notification ${notificationId} as read`,
                'NotificationService.markAsRead'
            );
        } else {
            this.logger.log(
                `Notification ${notificationId} was already marked as read`,
                'NotificationService.markAsRead'
            );
        }
    
        return {
            status: 'success',
            code: '200',
            message: 'Notification marked as read successfully',
            data: {
                notification: {
                    ...notification,
                    read: true
                }
            }
        };
    }

    async markAllAsRead(userId: string): Promise<any> {
        this.logger.log(
            `Attempting to mark all unread notifications as read for user ${userId}`,
            'NotificationService.markAllAsRead'
        );
    
        if (!userId) {
            this.logger.warn(
                'Invalid userId provided',
                'NotificationService.markAllAsRead'
            );
            throw new BadRequestException('Request failed at this time, please try again.');
        }
    
        const result = await this.notificationRepository.update(
            { userId, read: false },
            { read: true }
        );
    
        this.logger.log(
            `Marked ${result.affected} notifications as read for user ${userId}`,
            'NotificationService.markAllAsRead'
        );
    
        return {
            status: 'success',
            code: '200',
            message: 'All notifications marked as read successfully.',
            data: {
                updatedCount: result.affected
            }
        }
    }

    async createNotification(userId: string, title: string, message: string): Promise<Notification> {
        const notification = this.notificationRepository.create({
            userId,
            title,
            message,
            read: false
        });
        
        return await this.notificationRepository.save(notification);
    }
}
