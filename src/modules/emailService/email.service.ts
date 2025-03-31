import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import { AppLoggerService } from "../logger/logger.service";

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly logger: AppLoggerService
    ) {
        this.logger.log(
            'Initializing email service with:' + 
            `user: ${process.env.APP_EMAIL_GMAIL}, hasPassword: ${!!process.env.APP_PASSWORD_GMAIL}`,
            'EmailService'
        );

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.APP_EMAIL_GMAIL,
                pass: process.env.APP_PASSWORD_GMAIL,
            },
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
            if (error) {
                this.logger.error('Email service configuration error', error.stack, 'EmailService');
            } else {
                this.logger.log('Email server is ready to send messages', 'EmailService');
            }
        });
    }

    async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
        this.logger.log(`Sending welcome email to ${email}`, 'EmailService.sendWelcomeEmail');

        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: `Welcome to ${process.env.APP_NAME}`,
            text: `Welcome to ${process.env.APP_NAME}.`
        }

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Welcome email sent successfully to ${email}`, 'EmailService.sendWelcomeEmail');
        } catch (error) {
            this.logger.error(
                `Failed to send welcome email to ${email}`, 
                error.stack, 
                'EmailService.sendWelcomeEmail'
            );
            throw new Error(`Failed to send welcome email: ${error.message}`);
        }
    }

    async sendVerifyAccountEmail(email: string, token: string, firstName: string): Promise<void> {
        this.logger.log(`Sending verification email to ${email}`, 'EmailService.sendVerifyAccountEmail');

        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: `Verify your email address`,
            html: `
                <h1>Email Verification</h1>
                <p>Hi ${firstName},</p>
                <p>Please verify your email by clicking on the link below:</p>
                <a href="http://localhost:3000/verify-email?token=${token}">Verify Email</a>
                <p>If you did not request this verification, please ignore this email.</p>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Verification email sent successfully to ${email}`, 
                'EmailService.sendVerifyAccountEmail'
            );
            this.logger.debug(
                `Email sending result: ${JSON.stringify(result)}`,
                'EmailService.sendVerifyAccountEmail'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send verification email to ${email}`,
                error.stack,
                'EmailService.sendVerifyAccountEmail'
            );
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
    }

    async alertLoggedInFromNewDevice(email: string, firstName: string, currentIp: string, time: string): Promise<void> {
        this.logger.log(
            `Sending new device login alert to ${email}`,
            'EmailService.alertLoggedInFromNewDevice'
        );
    
        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: `Successful sign-in for ${email} from new device!`,
            text: `
                We're verifying a recent sign-in for ${email}.
    
                Timestamp: ${time},
                IP Address: ${currentIp}
    
                You're receiving this message because of a successful sign-in from a device
                that we didn't recognize. If you believe that this sign-in is suspicious,
                please reset your password immediately.
    
                If you're aware of this sign-in, please disregard this notice. This can happen when you use
                your browser incognito or private browing mode or clear cookies.
    
                Thanks,
                ${process.env.APP_NAME} Team
            `
        }
    
        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `New device login alert sent successfully to ${email}`,
                'EmailService.alertLoggedInFromNewDevice'
            );
            this.logger.debug(
                `Email sending result: ${JSON.stringify(result)}`,
                'EmailService.alertLoggedInFromNewDevice'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send new device login alert to ${email}`,
                error.stack,
                'EmailService.alertLoggedInFromNewDevice'
            );
            throw new Error(`Failed to send new device login alert: ${error.message}`);
        }
    }

    async forgotPasswordEmail(email: string, resetLink: string, firstName: string): Promise<void> {
        this.logger.log(
            `Sending password reset email to ${email}`,
            'EmailService.forgotPasswordEmail'
        );
    
        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: `Password Reset Request - ${process.env.APP_NAME}`,
            text: `Hi ${firstName},
    
            You recently requested to reset your password. Click the link below to reset it:
            ${resetLink}
    
            If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
            Best regards,
            ${process.env.APP_NAME} Team`
        }
    
        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Password reset email sent successfully to ${email}`,
                'EmailService.forgotPasswordEmail'
            );
            this.logger.debug(
                `Email sending result: ${JSON.stringify(result)}`,
                'EmailService.forgotPasswordEmail'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send password reset email to ${email}`,
                error.stack,
                'EmailService.forgotPasswordEmail'
            );
            throw new Error(`Failed to send password reset email: ${error.message}`);
        }
    }

    async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
        this.logger.log(
            `Sending password changed confirmation to ${email}`,
            'EmailService.sendPasswordChangedEmail'
        );
    
        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: 'Your password has been changed',
            text: `Hi ${firstName},
                
            This email confirms that your password has been changed.
    
            If you did not make this change, please contact our support team immediately.
    
            Best regards,
            ${process.env.APP_NAME} Team`
        };
    
        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Password changed confirmation sent successfully to ${email}`,
                'EmailService.sendPasswordChangedEmail'
            );
            this.logger.debug(
                `Email sending result: ${JSON.stringify(result)}`,
                'EmailService.sendPasswordChangedEmail'
            );
        } catch (error) {
            this.logger.error(
                `Failed to send password changed confirmation to ${email}`,
                error.stack,
                'EmailService.sendPasswordChangedEmail'
            );
            throw new Error(`Failed to send password changed confirmation: ${error.message}`);
        }
    }

}