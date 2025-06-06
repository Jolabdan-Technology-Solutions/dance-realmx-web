import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as SendGrid from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('@sendgrid/mail');
jest.mock('fs');
jest.mock('path');

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'email.sendgrid.apiKey': 'test-api-key',
        'email.sendgrid.fromEmail': 'test@example.com',
        'email.frontend.url': 'https://test.com',
        'email.templates.welcome.subject': 'Welcome!',
        'email.templates.coursePurchase.subject': 'Course Purchase',
        'email.templates.subscription.subject': 'Subscription',
        'email.templates.booking.subject': 'Booking',
        'email.templates': {
          welcome: { path: 'welcome.html' },
          coursePurchase: { path: 'course-purchase.html' },
          subscription: { path: 'subscription.html' },
          booking: { path: 'booking.html' },
        },
      };
      return config[key];
    }),
  };

  const mockTemplateContent = '<html>{{name}}</html>';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock fs and path
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockTemplateContent);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      (SendGrid.send as jest.Mock).mockResolvedValueOnce([
        { statusCode: 202 },
        {},
      ]);

      await service.sendWelcomeEmail(email, name);

      expect(SendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          from: 'test@example.com',
          subject: 'Welcome!',
          html: expect.stringContaining(name),
        }),
      );
    });

    it('should handle template not found error', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.sendWelcomeEmail('test@example.com', 'Test User'),
      ).rejects.toThrow('Welcome email template not found');
    });

    it('should handle SendGrid error', async () => {
      const error = new Error('SendGrid error');
      (SendGrid.send as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        service.sendWelcomeEmail('test@example.com', 'Test User'),
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendCoursePurchaseConfirmation', () => {
    it('should send course purchase confirmation successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const courseName = 'Test Course';
      const price = 99.99;

      (SendGrid.send as jest.Mock).mockResolvedValueOnce([
        { statusCode: 202 },
        {},
      ]);

      await service.sendCoursePurchaseConfirmation(
        email,
        name,
        courseName,
        price,
      );

      expect(SendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          from: 'test@example.com',
          subject: 'Course Purchase',
          html: expect.stringContaining(name),
        }),
      );
    });
  });

  describe('sendSubscriptionConfirmation', () => {
    it('should send subscription confirmation successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const planName = 'Premium Plan';
      const startDate = new Date();
      const expiryDate = new Date();

      (SendGrid.send as jest.Mock).mockResolvedValueOnce([
        { statusCode: 202 },
        {},
      ]);

      await service.sendSubscriptionConfirmation(
        email,
        name,
        planName,
        startDate,
        expiryDate,
      );

      expect(SendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          from: 'test@example.com',
          subject: 'Subscription',
          html: expect.stringContaining(name),
        }),
      );
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation successfully', async () => {
      const email = 'test@example.com';
      const instructorName = 'Test Instructor';
      const bookingDate = new Date();
      const bookingTime = '10:00 AM';
      const duration = '1 hour';
      const location = 'Online';
      const price = 99.99;

      (SendGrid.send as jest.Mock).mockResolvedValueOnce([
        { statusCode: 202 },
        {},
      ]);

      await service.sendBookingConfirmation(
        email,
        instructorName,
        bookingDate.toISOString(),
        new Date(bookingTime),
        duration,
        Number(location),
        String(price)
      );

      expect(SendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          from: 'test@example.com',
          subject: 'Booking',
          html: expect.stringContaining(instructorName),
        }),
      );
    });
  });
});
