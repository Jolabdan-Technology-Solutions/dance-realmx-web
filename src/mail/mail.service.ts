import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { MailerService } from '@nestjs-modules/mailer';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly mailFrom: string;
  private isSendGridVerified = false;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    const sendgridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      this.logger.warn(
        'SENDGRID_API_KEY is not defined in environment variables. Email functionality will be disabled.',
      );
      return;
    }
    SendGrid.setApiKey(sendgridApiKey);

    const mailFrom = this.configService.get<string>('MAIL_FROM');
    if (!mailFrom) {
      this.logger.warn(
        'MAIL_FROM is not defined in environment variables. Email functionality will be disabled.',
      );
      return;
    }
    this.mailFrom = mailFrom;
  }

  async onModuleInit() {
    try {
      await this.verifySendGridConnection();
    } catch (error) {
      this.logger.error(
        'SendGrid verification failed, but continuing application startup. Email functionality may be limited.',
      );
      this.logger.error(
        'Please check your SendGrid API key and ensure it is valid and has the necessary permissions.',
      );
      this.logger.error(
        'You can get a new API key from: https://app.sendgrid.com/settings/api_keys',
      );
    }
  }

  private async verifySendGridConnection(): Promise<void> {
    try {
      // SendGrid doesn't have a direct connection test API
      // We'll verify by making a test API call to get account info
      const response = await SendGrid.send({
        to: 'test@example.com',
        from: this.mailFrom,
        subject: 'SendGrid Connection Test',
        text: 'This is a test email to verify SendGrid connection.',
        mailSettings: {
          sandboxMode: {
            enable: true, // This prevents the email from actually being sent
          },
        },
      });

      this.isSendGridVerified = true;
      this.logger.log('SendGrid connection verified successfully');
      this.logger.log(`SendGrid API key is valid and connection is working`);
    } catch (error) {
      this.isSendGridVerified = false;
      this.logger.error('SendGrid connection verification failed:', error);
      if (error.response) {
        const errorBody = error.response.body;
        if (errorBody?.errors?.[0]?.message) {
          this.logger.error(
            `SendGrid API Error: ${errorBody.errors[0].message}`,
          );
          if (errorBody.errors[0].help) {
            this.logger.error(`Help: ${errorBody.errors[0].help}`);
          }
        } else {
          this.logger.error(`SendGrid API Error: ${JSON.stringify(errorBody)}`);
        }
      }
      throw new InternalServerErrorException(
        'Failed to verify SendGrid connection. Please check your API key and permissions.',
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
    if (!this.isSendGridVerified) {
      this.logger.warn(
        `Attempted to send email to ${options.to} but SendGrid is not properly configured.`,
      );
      return;
    }

    try {
      const html = await this.compileTemplate(
        options.template,
        options.context,
      );

      const msg = {
        to: options.to,
        from: this.mailFrom,
        subject: options.subject,
        html,
      };

      await SendGrid.send(msg);
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(
        `Error sending email to ${options.to}: ${error.message}`,
        error.stack,
      );
      if (error.response) {
        const errorBody = error.response.body;
        if (errorBody?.errors?.[0]?.message) {
          this.logger.error(
            `SendGrid API Error: ${errorBody.errors[0].message}`,
          );
        } else {
          this.logger.error(`SendGrid API Error: ${JSON.stringify(errorBody)}`);
        }
      }
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
