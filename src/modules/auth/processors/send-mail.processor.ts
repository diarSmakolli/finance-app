import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In } from 'typeorm';
import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { AppLoggerService } from '../../logger/logger.service';
import { Job } from 'bull';
import { User } from "src/modules/users/entities/user.entity";
import { Notification } from "src/modules/notifications/notification.entity";
import { EmailService } from "src/modules/emailService/email.service";

@Injectable()
@Processor('send-mail-auth')
export class SendMailAuthProcessor {

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
        private readonly logger: AppLoggerService,
        private readonly emailService: EmailService
    ) {}

    @OnQueueActive()
    onActive(job: Job) {
        this.logger.log(
            `Processing job ${job.id} of type ${job.name}`,
            'SendMailAuthProcessor'
        );
    }

    @OnQueueCompleted()
    onComplete(job: Job, result: any) {
        this.logger.log(
            `Job ${job.id} completed. Archived ${result.archived} emails`,
            'SendMailAuthProcessor'
        );
    }

    @OnQueueFailed()
    onError(job: Job<any>, error: any) {
        this.logger.error(
            `Failed job ${job.id}: ${error.message}`,
            error.stack,
            'SendMailAuthProcessor'
        );
    }

    @Process('create-client')
    async sendWelcomeEmail(job: Job<{ email: string, firstName: string, lastName: string }>) {
        const {
            email,
            firstName,
            lastName
        } = job.data;

        try {
            await this.emailService.sendWelcomeEmail(email, firstName);
            this.logger.log(
                `Welcome email sent successfully to ${email}`,
                'SendMailAuthProcessor.sendWelcomeEmail'
            );
        } catch(error) {
            this.logger.error(
                `Error sending welcome email to ${email}: ${error.message}`,
                error.stack,
                'SendMailAuthProcessor.sendWelcomeEmail'
            );
            throw error;
        }

    }   

    @Process('email-verification')
    async sendEmailVerificationEmail(job: Job<{ email: string, token: string, firstName: string }>) {
        const {
            email,
            token,
            firstName
        } = job.data;

        try {
            await this.emailService.sendVerifyAccountEmail(email, token, firstName);
            this.logger.log(
                `Verification email sent successfully to ${email}`,
                'SendMailAuthProcessor.sendEmailVerificationEmail'
            );
        } catch(error) {
            this.logger.error(
                `Error sending verification email to ${email}: ${error.message}`,
                error.stack,
                'SendMailAuthProcessor.sendEmailVerificationEmail'
            );
            throw error;
        }
    }

    @Process('login-new-device')
    async sendEmailLoginNewDevice(job: Job<{ email: string, firstName: string, ip: string, time: string }>) {
        const {
            email,
            firstName,
            ip,
            time
        } = job.data;

        try {
            await this.emailService.alertLoggedInFromNewDevice(email, firstName, ip, time);
            this.logger.log(
                `New device login alert email sent successfully to ${email}`,
                'SendMailAuthProcessor.sendEmailLoginNewDevice'
            );
        } catch(error) {
            this.logger.error(
                `Error sending new device login alert email to ${email}: ${error.message}`,
                error.stack,
                'SendMailAuthProcessor.sendEmailLoginNewDevice'
            );
            throw error;
        }
    }

    @Process('forgot-password')
    async sendEmailForgotPassword(job: Job<{ email: string, resetLink: string, firstName: string }>) {
        const {
            email,
            resetLink,
            firstName
        } = job.data;

        try {
            await this.emailService.forgotPasswordEmail(email, resetLink, firstName);
            this.logger.log(
                `Forgot password email sent successfully to ${email}`,
                'SendMailAuthProcessor.sendEmailForgotPassword'
            );
        } catch(error) {
            this.logger.error(
                `Error sending forgot password email to ${email}: ${error.message}`,
                error.stack,
                'SendMailAuthProcessor.sendEmailForgotPassword'
            );
            throw error;
        }
    }

    @Process('reset-password')
    async sendEmailResetPassword(job: Job<{ email: string, firstName: string }>) {
        const {
            email,
            firstName
        } = job.data;

        try {
            await this.emailService.sendPasswordChangedEmail(email, firstName);
            this.logger.log(
                `Reset password email sent successfully to ${email}`,
                'SendMailAuthProcessor.sendEmailResetPassword'
            );
        } catch(error) {
            this.logger.error(
                `Error sending reset password email to ${email}: ${error.message}`,
                error.stack,
                'SendMailAuthProcessor.sendEmailResetPassword'
            );
            throw error;
        }
    }

    @Process('account-verified')
    async sendEmailAccountVerified(job: Job<{ email: string, firstName: string }>) {
        const {
            email,
            firstName
        } = job.data;

        try {
            await this.emailService.sendAccountVerifiedEmail(email, firstName);
            this.logger.log(
                `Account verified email sent successfully to ${email}`,
                'SendMailAuthProcessor.sendEmailAccountVerified'
            );
        } catch(error) {
            this.logger.error(
                `Error sending account verified email to ${email}: ${error.message}`,
                error.stack,
                'SendMailAuthProcessor.sendEmailAccountVerified'
            );
            throw error;
        }
    }
    

}