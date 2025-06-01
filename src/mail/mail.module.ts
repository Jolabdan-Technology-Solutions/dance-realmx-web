import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import emailConfig from '../config/email.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [emailConfig],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
