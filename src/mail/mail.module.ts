import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
      template: {
        dir: process.cwd() + '/src/mail/templates',
        adapter: require('handlebars'),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
