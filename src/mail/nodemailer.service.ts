import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NodemailerService {
  private readonly logger = new Logger(NodemailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    // Verify transporter configuration
    this.verifyTransporter();
  }

  private async verifyTransporter(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection verification failed:', error);
      throw new InternalServerErrorException(
        'Failed to verify SMTP connection',
      );
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'mail',
        'templates',
        `${templateName}.html`,
      );
      return await fs.promises.readFile(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(
        `Error loading template ${templateName}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to load email template: ${templateName}`,
      );
    }
  }

  private async compileTemplate(
    templateName: string,
    data: any,
  ): Promise<string> {
    try {
      const template = await this.loadTemplate(templateName);
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error(
        `Error compiling template ${templateName}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to compile email template: ${templateName}`,
      );
    }
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    template: string;
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      const html = await this.compileTemplate(
        options.template,
        options.context,
      );
      const from = this.configService.get<string>('MAIL_FROM');

      if (!from) {
        throw new Error('MAIL_FROM is not defined in environment variables');
      }

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}`,
        info.messageId,
      );
    } catch (error) {
      this.logger.error(
        `Error sending email to ${options.to}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: 'Welcome to Dance Realm!',
        template: 'welcome',
        context: {
          name,
          email,
          loginUrl: this.configService.get('FRONTEND_URL') + '/login',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending welcome email to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to send welcome email');
    }
  }

  async sendCoursePurchaseConfirmation(
    email: string,
    name: string,
    courseName: string,
    price: number,
  ): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: 'Course Purchase Confirmation',
        template: 'course-purchase',
        context: {
          name,
          courseName,
          price,
          purchaseDate: new Date().toLocaleDateString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending course purchase confirmation to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send course purchase confirmation',
      );
    }
  }

  async sendSubscriptionConfirmation(
    email: string,
    name: string,
    tier: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: 'Subscription Confirmation',
        template: 'subscription',
        context: {
          name,
          tier,
          startDate: startDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending subscription confirmation to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send subscription confirmation',
      );
    }
  }

  async sendBookingConfirmation(
    email: string,
    name: string,
    instructorName: string,
    date: Date,
    time: string,
    duration: number,
    location: string,
  ): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: 'Booking Confirmation',
        template: 'booking',
        context: {
          name,
          instructorName,
          date: date.toLocaleDateString(),
          time,
          duration,
          location,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending booking confirmation to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send booking confirmation',
      );
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
      await this.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        context: {
          resetUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send password reset email',
      );
    }
  }

  async sendPasswordResetConfirmationEmail(email: string): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: 'Password Reset Successful',
        template: 'password-reset-confirmation',
      });
    } catch (error) {
      this.logger.error(
        `Error sending password reset confirmation to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send password reset confirmation',
      );
    }
  }

  async sendPasswordChangeNotificationEmail(email: string): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: 'Password Changed',
        template: 'password-change-notification',
      });
    } catch (error) {
      this.logger.error(
        `Error sending password change notification to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send password change notification',
      );
    }
  }

  async sendEmailVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
      await this.sendMail({
        to: email,
        subject: 'Verify Your Email',
        template: 'email-verification',
        context: {
          verifyUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending email verification to ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send email verification',
      );
    }
  }
}
