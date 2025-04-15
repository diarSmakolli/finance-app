import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { AppLoggerService } from '../logger/logger.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationService {
    constructor(
        @InjectQueue('mark-notifications') private readonly markNotificationsQueue: Queue,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        private readonly logger: AppLoggerService
    ) {}

    async getAllByUserId(
        userId: string,
        options: {
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        } = {}
    ): Promise<any> {
        const { 
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = options;

        this.logger.log(
            `Fetching notifications for user ${userId} (page: ${page}, limit: ${limit})`,
            'NotificationService.getAllByUserId'
        );
    
        if(!userId) {
            this.logger.warn('Invalid userId provided', 'NotificationService.getAllByUserId');
            throw new BadRequestException('Request failed at this time, please try again later.');
        }
    
    
        const [notifications, total] = await this.notificationRepository.findAndCount({
            where: { 
                userId 
            },
            order: { 
                [sortBy]: sortOrder
            },
            skip: (page - 1) * limit,
            take: limit
        });
    
        if(!notifications.length || total === 0) {
            this.logger.warn(
                `No notifications found for user ${userId} on page ${page}`,
                'NotificationService.getAllByUserId'
            );
            throw new NotFoundException('No notifications founded in our records.');
        }
    
        const pages = Math.ceil(total / limit);
    
        this.logger.log(
            `Retrieved ${notifications.length} notifications for user ${userId} (page ${page}/${pages})`,
            'NotificationService.getAllByUserId'
        );
    
        return {
            status: 'success',
            code: '200',
            message: 'Notifications retrieved successfully.',
            data: {
                notifications,
                total,
                pages,
                currentPage: page
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

        if(!unreadCount) {
            throw new NotFoundException('No notifications founded in our records.');
        }

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
    
        if (!notifications || notifications.length === 0) {
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
            where: { 
                id: notificationId, 
                userId: userId
            },
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
    
        const notification = await this.notificationRepository.findOne({
            where: { 
                id: notificationId,
                userId: userId
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

    // WORKING
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

        // const queryBuilder = this.notificationRepository.createQueryBuilder()
        //     .update()
        //     .set({ read: true })
        //     .where("userId = :userId", { userId })
        //     .andWhere("read = false");
        
        
        // let result = await queryBuilder.execute();

        // const updatedCount = result.affected ?? 0;

        // this.logger.log(
        //     `Marked ${result.affected} notifications as read for user ${userId}`,
        //     'NotificationService.markAllAsRead'
        // );

        this.markNotificationsQueue.add(
            'markAllAsRead', {
                userId
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true
            }
        );
    
        return {
            status: 'success',
            code: '200',
            message: 'Notifications has been processed.',
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
