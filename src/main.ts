import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // Load environment variables before creating the app
  dotenv.config();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.useLogger(new Logger());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure raw body parser for Stripe webhooks
  app.use(
    '/api/courses/webhook/stripe',
    bodyParser.raw({ type: 'application/json' }),
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(bodyParser.json());

  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Dance Realm API')
    .setDescription('The Dance Realm API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controllers
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('courses', 'Course management endpoints')
    .addTag('subscriptions', 'Subscription management endpoints')
    .addTag('bookings', 'Booking management endpoints')
    .addTag('resources', 'Resource management endpoints')
    .addTag('certifications', 'Certification management endpoints')
    .addTag('directory', 'Directory management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Dance Realm API Documentation',
  });

  const port = process.env.PORT || 3000;

  await app
    .listen(port)
    .then(() => {
      console.log(`Server is running on port ${port}`);
      console.log(`Swagger documentation is available at /docs`);
    })
    .catch((error) => {
      console.error('Error starting server:', error);
    });
}
bootstrap();
