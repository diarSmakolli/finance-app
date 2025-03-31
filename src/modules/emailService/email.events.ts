import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class EmailEvents {
    constructor(
        private readonly emailService: EmailService,
        private readonly logger: AppLoggerService
    ) {}

    @OnEvent('login.new_device')
    async handleNewDeviceLogin(payload: {
        email: string;
        firstName: string;
        ip: string;
        time: string;
    }) {
        this.logger.log(
            `Processing new device login event for ${payload.email}`,
            'EmailEvents.handleNewDeviceLogin'
        );
        
        try {
            await this.emailService.alertLoggedInFromNewDevice(
                payload.email,
                payload.firstName,
                payload.ip,
                payload.time
            );
            this.logger.log(
                `Successfully processed new device login event for ${payload.email}`,
                'EmailEvents.handleNewDeviceLogin'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send new device login email to ${payload.email}`,
                error.stack,
                'EmailEvents.handleNewDeviceLogin'
            );
        }
    }

    @OnEvent('email.verification')
    async handleEmailVerification(payload: {
        email: string;
        token: string;
        firstName: string;
    }) {
        this.logger.log(
            `Processing email verification event for ${payload.email}`,
            'EmailEvents.handleEmailVerification'
        );
        
        try {
            await this.emailService.sendVerifyAccountEmail(
                payload.email,
                payload.token,
                payload.firstName
            );
            this.logger.log(
                `Successfully sent verification email to ${payload.email}`,
                'EmailEvents.handleEmailVerification'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send verification email to ${payload.email}`,
                error.stack,
                'EmailEvents.handleEmailVerification'
            );
        }
    }

    @OnEvent('email.welcome')
    async handleWelcomeEmail(payload: {
        email: string,
        firstName: string
    }) {
        this.logger.log(
            `Processing welcome email event for ${payload.email}`,
            'EmailEvents.handleWelcomeEmail'
        );
        
        try {
            await this.emailService.sendWelcomeEmail(
                payload.email,
                payload.firstName
            );
            this.logger.log(
                `Successfully sent welcome email to ${payload.email}`,
                'EmailEvents.handleWelcomeEmail'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send welcome email to ${payload.email}`,
                error.stack,
                'EmailEvents.handleWelcomeEmail'
            );
        }
    }

    @OnEvent('email.forgot')
    async handleForgotEmail(payload: {
        email: string,
        resetLink: string,
        firstName: string,
    }) {
        this.logger.log(
            `Processing forgot password email event for ${payload.email}`,
            'EmailEvents.handleForgotEmail'
        );
        
        try {
            await this.emailService.forgotPasswordEmail(
                payload.email,
                payload.resetLink,
                payload.firstName
            );
            this.logger.log(
                `Successfully sent forgot password email to ${payload.email}`,
                'EmailEvents.handleForgotEmail'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send forgot password email to ${payload.email}`,
                error.stack,
                'EmailEvents.handleForgotEmail'
            );
        }
    }

    @OnEvent('email.password_changed')
    async handlePasswordChanged(payload: {
        email: string,
        firstName: string
    }) {
        this.logger.log(
            `Processing password changed email event for ${payload.email}`,
            'EmailEvents.handlePasswordChanged'
        );
        
        try {
            await this.emailService.sendPasswordChangedEmail(
                payload.email,
                payload.firstName
            );
            this.logger.log(
                `Successfully sent password changed email to ${payload.email}`,
                'EmailEvents.handlePasswordChanged'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send password changed email to ${payload.email}`,
                error.stack,
                'EmailEvents.handlePasswordChanged'
            );
        }
    }
}
