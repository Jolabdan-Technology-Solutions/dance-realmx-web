import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

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

  await app
    .listen(process.env.PORT ?? 3000)
    .then(() => {
      console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
      console.log(`Swagger documentation is available at /docs`);
    })
    .catch((error) => {
      console.error('Error starting server:', error);
    });
}
bootstrap();
