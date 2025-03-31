import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>
    ) {}

    async getAllByUserId(userId: string): Promise<any> {
        if(!userId) {
            throw new BadRequestException('Request failed, try again.');
        }

        const notifications = await this.notificationRepository.find({
            where: {
                userId
            },
            order: {
                createdAt: 'DESC'
            }
        });

        if(!notifications) {
            throw new NotFoundException('No notifications found at this time.');
        }

        return {
            status: 'success',
            code: '200',
            message: 'Notifications retrieved successfully.',
            data: {
                notifications
            }
        }
    }

    async getUnReadNotificationsNumber(userId: string): Promise<any> {
        if(!userId) {
            throw new BadRequestException('Request failed, try again.');
        }

        const unreadCount = await this.notificationRepository.count({
            where: {
                userId,
                read: false,
            }
        });

        return {
            status: 'success',
            code: '200',
            message: 'Unread notifications count retrieved successfully.',
            data: {
                unreadCount: unreadCount
            }
        }
    }

    async getRecentNotifications(userId: string, limit: number = 5): Promise<any> {
        if (!userId) {
            throw new BadRequestException('Request failed, try again.');
        }
    
        const notifications = await this.notificationRepository.find({
            where: { userId },
            order: {
                createdAt: 'DESC'
            },
            take: limit
        });
    
        if (!notifications.length) {
            throw new NotFoundException('No recent notifications found.');
        }
    
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
        if (!userId) {
            throw new BadRequestException('Request failed, try again.');
        }

        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Request failed, try again.');
        }

        return {
            status: 'success',
            code: '200',
            message: 'Recent notifications retrieved successfully.',
            data: {
                notification: notification
            }
        }
    }

    async markAsRead(userId: string, notificationId: string): Promise<any> {
        if (!userId) {
            throw new BadRequestException('Request failed, try again.');
        }
    
        // First find the notification
        const notification = await this.notificationRepository.findOne({
            where: { 
                id: notificationId,
                userId 
            }
        });
    
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
    
        // Only update if notification is not already read
        if (!notification.read) {
            await this.notificationRepository.update(
                { id: notificationId },
                { read: true }
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
        if (!userId) {
            throw new BadRequestException('Request failed, try again.');
        }

        const result = await this.notificationRepository.update(
            { userId, read: false },
            { read: true }
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
