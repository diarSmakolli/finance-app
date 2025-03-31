import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';

@Injectable()
export class EmailEvents {
    constructor(private readonly emailService: EmailService) {}

    @OnEvent('login.new_device')
    async handleNewDeviceLogin(payload: {
        email: string;
        firstName: string;
        ip: string;
        time: string;
    }) {
        try {
            await this.emailService.alertLoggedInFromNewDevice(
                payload.email,
                payload.firstName,
                payload.ip,
                payload.time
            );
        } catch (error) {
            console.error('Failed to send new device login email:', error);
        }
    }

    @OnEvent('email.verification')
    async handleEmailVerification(payload: {
        email: string;
        token: string;
        firstName: string;
    }) {
        console.log('Email verification event received:', payload); // Debug log
        try {
            await this.emailService.sendVerifyAccountEmail(
                payload.email,
                payload.token,
                payload.firstName
            );
            console.log('Verification email sent successfully'); // Debug log
        } catch (error) {
            console.error('Failed to send verification email:', error);
        }
    }

    @OnEvent('email.welcome')
    async handleWelcomeEmail(payload: {
        email: string,
        firstName: string
    }) {
        console.log('Welcome email event received: ', payload);
        try {
            await this.emailService.sendWelcomeEmail(payload.email, payload.firstName);
            console.log('Welcome email sent successfully.');
        } catch(error) {
            console.error('Failed to send welcome email: ', error);
        }
    }

    @OnEvent('email.forgot')
    async handleForgotEmail(payload: {
        email: string,
        resetLink: string,
        firstName: string,
    }) {
        console.log('Forgot email event received: ', payload);
        try {
            await this.emailService.forgotPasswordEmail(payload.email, payload.resetLink, payload.firstName);
            console.log('Forgot email has been sent.');
        } catch(error) {
            console.error('Failed to send forgot password: ', error);
        }
    }

    @OnEvent('email.password_changed')
    async handlePasswordChanged(payload: {
        email: string,
        firstName: string
    }) {
        try {
            await this.emailService.sendPasswordChangedEmail(
                payload.email,
                payload.firstName
            );
        } catch (error) {
            console.error('Failed to send password changed email:', error);
        }
    }

}
