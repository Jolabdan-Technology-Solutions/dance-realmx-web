import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@dancerealm.com',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'https://dancerealm.com',
  },
  templates: {
    welcome: {
      subject: 'Welcome to Dance Realm!',
      path: 'templates/welcome.html',
    },
    coursePurchase: {
      subject: 'Course Purchase Confirmation',
      path: 'templates/course-purchase.html',
    },
    subscription: {
      subject: 'Subscription Confirmation',
      path: 'templates/subscription.html',
    },
    booking: {
      subject: 'Booking Confirmation',
      path: 'templates/booking.html',
    },
  },
}));
