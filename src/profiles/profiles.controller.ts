import { Controller, Get, Patch, Body, UseGuards, Req, Post, UploadedFile, UseInterceptors, BadRequestException, Param } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RequireSubscription } from '../auth/decorators/require-subscription.decorator';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.profilesService.findOne(req.user.sub);
  }

  @Patch('me')
  async updateMyProfile(@Req() req: RequestWithUser, @Body() updateData: any) {
    return this.profilesService.update(req.user.sub, updateData);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.cloudinaryService.uploadFile(file) as { secure_url: string };
      await this.profilesService.update(req.user.sub, {
        profile_image_url: result.secure_url,
      });
      return { url: result.secure_url };
    } catch (error) {
      if (error.message.includes('Cloudinary is not configured')) {
        throw new BadRequestException('File upload service is not configured. Please contact support.');
      }
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Post('become-professional')
  @RequireSubscription('BOOKING_PROFESSIONAL')
  async becomeProfessional(@Req() req: { user: User }) {
    return this.profilesService.becomeProfessional(req.user.id);
  }

  @Post(':id/book')
  @RequireSubscription('BOOKING_USER')
  async bookProfessional(@Param('id') id: string, @Req() req: { user: User }) {
    return this.profilesService.bookProfessional(id, req.user.id);
  }

  @Get('professionals')
  @RequireSubscription('BOOKING_USER')
  async getProfessionals() {
    return this.profilesService.getProfessionals();
  }
}
