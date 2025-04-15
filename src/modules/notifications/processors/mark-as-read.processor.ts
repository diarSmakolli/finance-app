import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { EmailService } from 'src/modules/emailService/email.service';
import { AppLoggerService } from 'src/modules/logger/logger.service';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Notification } from '../notification.entity';

@Injectable()
@Processor('mark-notifications')
export class MarkNotificationsProcessor {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly logger: AppLoggerService,
    private readonly emailService: EmailService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name}`,
      'MarkNotificationsProcessor',
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.log(
      `Job ${job.id} completed. Archived ${result.archived}`,
      'MarkNotificationsProcessor',
    );
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    this.logger.error(
      `Failed job ${job.id}: ${error.message}`,
      error.stack,
      'MarkNotificationsProcessor',
    );
  }



  // Mark all notifications of user as read
  @Process('markAllAsRead')
  async handleMarkAllAsRead(job: Job<{ userId: string }>) {
    const start = performance.now();

    const { userId } = job.data;

    this.logger.log(
      `Marking notifications as read for user ${userId}`,
      'MarkNotificationsProcessor'
    );

    try {
      const result = await this.notificationRepository
        .createQueryBuilder()
        .update()
        .set({ read: true })
        .where('userId = :userId', { userId })
        .andWhere('read = false')
        .execute();

      const updatedCount = result.affected ?? 0;

      const end = performance.now();


      this.logger.log(
        `Marked ${updatedCount} notifications as read for user ${userId}
        in ${(end - start).toFixed(2)} ms
        `,
        'MarkNotificationsProcessor'
      );

      

      return { updated: updatedCount };
    } catch (error) {
      this.logger.error(
        `Failed to update notifications for user ${userId}: ${error.message}`,
        error.stack,
        'MarkNotificationsProcessor'
      );
      throw error;
    }
  }


}
