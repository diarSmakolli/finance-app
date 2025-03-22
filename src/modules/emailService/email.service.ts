import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        console.log('Initializing email service with:', { 
            user: process.env.APP_EMAIL_GMAIL,
            // Don't log the actual password
            hasPassword: !!process.env.APP_PASSWORD_GMAIL 
        });
        
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
                console.error('Email service error:', error);
            } else {
                console.log('Email server is ready to send messages');
            }
        });
    }

    async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: `Welcome to ${process.env.APP_NAME}`,
            text: `Welcome to ${process.env.APP_NAME}.`
        }

        try {
            await this.transporter.sendMail(mailOptions);
        } catch(error) {
            throw new Error(`Failed to send verification email: ${error.message}`)
        }
    }

    async sendVerifyAccountEmail(email: string, token: string, firstName: string): Promise<void> {
        console.log('Attempting to send verification email to:', email); // Debug log
        
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
            console.log('Email sent successfully:', result); // Debug log
        } catch(error) {
            console.error('Email sending failed:', error);
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
    }

    async alertLoggedInFromNewDevice(email: string, firstName: string, currentIp: string, time: string): Promise<void> {
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
            `
        }

        try {
            await this.transporter.sendMail(mailOptions);
        } catch(error) {
            throw new Error(`Failed to send verification email: ${error.message}`)
        }
    }

    async forgotPasswordEmail(email: string, resetLink: string, firstName: string) {
        const mailOptions = {
            from: process.env.APP_EMAIL_GMAIL,
            to: email,
            subject: `Forgot password`,
            text: `Hi, ${firstName}, Link to recover your account: ${resetLink}`
        }

        try {
            await this.transporter.sendMail(mailOptions);
        } catch(error) {
            throw new Error(`Failed to send verification email: ${error.message}`)
        }
    }


}