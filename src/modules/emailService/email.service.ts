import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import { AppLoggerService } from "../logger/logger.service";
import { welcomeEmailTemplate } from "../templates/auth/welcome.email";
import { verifyAccountTemplate } from "../templates/auth/verify-account.email";
import { alertNewLoginTemplate } from "../templates/auth/login-new-device-alert.email";
import { resetPasswordEmailTemplate } from "../templates/auth/reset-password.email";
import { passwordChangedNotificationTemplate } from "../templates/auth/password-changed.email";
import { accountVerifiedEmailTemplate } from "../templates/auth/account-verified.email";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly logger: AppLoggerService) {
    this.logger.log(
      'Initializing email service with:' +
        `user: ${process.env.APP_EMAIL_GMAIL}, hasPassword: ${!!process.env.APP_PASSWORD_GMAIL}`,
      'EmailService',
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
        this.logger.error(
          'Email service configuration error',
          error.stack,
          'EmailService',
        );
      } else {
        this.logger.log(
          'Email server is ready to send messages',
          'EmailService',
        );
      }
    });
  }

  // DONE
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    this.logger.log(
      `Sending welcome email to ${email}`,
      'EmailService.sendWelcomeEmail',
    );

    const mailOptions = {
      from: process.env.APP_EMAIL_GMAIL,
      to: email,
      subject: `Welcome to ${process.env.APP_NAME}`,
      html: welcomeEmailTemplate(
        firstName,
        process.env.APP_NAME || '',
        process.env.APP_URL || '',
        process.env.SUPPORT_EMAIL || '',
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Welcome email sent successfully to ${email}`,
        'EmailService.sendWelcomeEmail',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}`,
        error.stack,
        'EmailService.sendWelcomeEmail',
      );
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  // DONE
  async sendVerifyAccountEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(
      `Sending verification email to ${email}`,
      'EmailService.sendVerifyAccountEmail',
    );

    const mailOptions = {
      from: process.env.APP_EMAIL_GMAIL,
      to: email,
      subject: `Verify your account!`,
      html: verifyAccountTemplate(
        email,
        token,
        firstName,
        process.env.APP_NAME || '',
        process.env.APP_URL || '',
        process.env.SUPPORT_EMAIL || '',
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Verification email sent successfully to ${email}`,
        'EmailService.sendVerifyAccountEmail',
      );
      this.logger.debug(
        `Email sending result: ${JSON.stringify(result)}`,
        'EmailService.sendVerifyAccountEmail',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
        'EmailService.sendVerifyAccountEmail',
      );
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  // DONE
  async alertLoggedInFromNewDevice(
    email: string,
    firstName: string,
    ip: string,
    time: string,
  ): Promise<void> {
    this.logger.log(
      `Sending new device login alert to ${email}`,
      'EmailService.alertLoggedInFromNewDevice',
    );

    const mailOptions = {
      from: process.env.APP_EMAIL_GMAIL,
      to: email,
      subject: `Successful sign-in for ${email} from new device!`,
      html: alertNewLoginTemplate(
        email,
        firstName,
        ip,
        time,
        process.env.APP_NAME || '',
        process.env.APP_URL || '',
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `New device login alert sent successfully to ${email}`,
        'EmailService.alertLoggedInFromNewDevice',
      );
      this.logger.debug(
        `Email sending result: ${JSON.stringify(result)}`,
        'EmailService.alertLoggedInFromNewDevice',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send new device login alert to ${email}`,
        error.stack,
        'EmailService.alertLoggedInFromNewDevice',
      );
      throw new Error(
        `Failed to send new device login alert: ${error.message}`,
      );
    }
  }

  // DONE
  async forgotPasswordEmail(
    email: string,
    resetLink: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(
      `Sending password reset email to ${email}`,
      'EmailService.forgotPasswordEmail',
    );

    const mailOptions = {
      from: process.env.APP_EMAIL_GMAIL,
      to: email,
      subject: `Password Reset Request - ${process.env.APP_NAME}`,
      html: resetPasswordEmailTemplate(
        email,
        resetLink,
        firstName,
        process.env.APP_NAME || '',
        process.env.APP_URL || '',
        process.env.SUPPORT_EMAIL || '',
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Password reset email sent successfully to ${email}`,
        'EmailService.forgotPasswordEmail',
      );
      this.logger.debug(
        `Email sending result: ${JSON.stringify(result)}`,
        'EmailService.forgotPasswordEmail',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
        'EmailService.forgotPasswordEmail',
      );
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  // DONE
  async sendPasswordChangedEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(
      `Sending password changed confirmation to ${email}`,
      'EmailService.sendPasswordChangedEmail',
    );

    const mailOptions = {
      from: process.env.APP_EMAIL_GMAIL,
      to: email,
      subject: 'Your password has been changed',
      html: passwordChangedNotificationTemplate(
        email,
        firstName,
        process.env.APP_NAME || '',
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Password changed confirmation sent successfully to ${email}`,
        'EmailService.sendPasswordChangedEmail',
      );
      this.logger.debug(
        `Email sending result: ${JSON.stringify(result)}`,
        'EmailService.sendPasswordChangedEmail',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password changed confirmation to ${email}`,
        error.stack,
        'EmailService.sendPasswordChangedEmail',
      );
      throw new Error(
        `Failed to send password changed confirmation: ${error.message}`,
      );
    }
  }

  // DONE
  async sendAccountVerifiedEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(
      `Sending verify account confirmation to ${email}`,
      'EmailService.sendAccountVerifiedEmail',
    );

    const mailOptions = {
      from: process.env.APP_EMAIL_GMAIL,
      to: email,
      subject: 'Your account has been verified',
      html: accountVerifiedEmailTemplate(
        email,
        firstName,
        process.env.APP_NAME || '',
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Account verified confirmation sent successfully to ${email}`,
        'EmailService.sendAccountVerifiedEmail',
      );
      this.logger.debug(
        `Email sending result: ${JSON.stringify(result)}`,
        'EmailService.sendAccountVerifiedEmail',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send account verify confirmation to ${email}`,
        error.stack,
        'EmailService.sendAccountVerifiedEmail',
      );
      throw new Error(
        `Failed to send account verify confirmation: ${error.message}`,
      );
    }
  }



}