import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      `${templateName}.html`,
    );
    return fs.promises.readFile(templatePath, 'utf-8');
  }

  private async compileTemplate(
    templateName: string,
    data: any,
  ): Promise<string> {
    const template = await this.loadTemplate(templateName);
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }

  async sendWelcomeEmail(email: string, name: string) {
    const html = await this.compileTemplate('welcome', {
      name,
      email,
      loginUrl: this.configService.get('FRONTEND_URL') + '/login',
    });

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Welcome to Dance Realm!',
      html,
    });
  }

  async sendCoursePurchaseConfirmation(
    email: string,
    name: string,
    courseName: string,
    price: number,
  ) {
    const html = await this.compileTemplate('course-purchase', {
      name,
      courseName,
      price,
      purchaseDate: new Date().toLocaleDateString(),
    });

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Course Purchase Confirmation',
      html,
    });
  }

  async sendSubscriptionConfirmation(
    email: string,
    name: string,
    tier: string,
    startDate: Date,
    endDate: Date,
  ) {
    const html = await this.compileTemplate('subscription', {
      name,
      tier,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    });

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Subscription Confirmation',
      html,
    });
  }

  async sendBookingConfirmation(
    email: string,
    name: string,
    instructorName: string,
    date: Date,
    time: string,
    duration: number,
    location: string,
  ) {
    const html = await this.compileTemplate('booking', {
      name,
      instructorName,
      date: date.toLocaleDateString(),
      time,
      duration,
      location,
    });

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Booking Confirmation',
      html,
    });
  }
}
