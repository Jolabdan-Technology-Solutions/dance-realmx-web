import { Controller, Get, Patch, Body, UseGuards, Req, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

interface RequestWithUser extends Request {
  user: {
    id: number;
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
    return this.profilesService.findOne(req.user.id);
  }

  @Patch('me')
  async updateMyProfile(@Req() req: RequestWithUser, @Body() updateData: any) {
    return this.profilesService.update(req.user.id, updateData);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadFile(file);
    await this.profilesService.update(req.user.id, {
      profile_image_url: result.secure_url,
    });
    return { url: result.secure_url };
  }
}
