import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsModule } from 'src/permissions/permissions.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key', // Use environment variable
      signOptions: { expiresIn: '24h' },
    }),
    PermissionsModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
