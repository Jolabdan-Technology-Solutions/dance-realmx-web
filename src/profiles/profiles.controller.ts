import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

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
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.profilesService.findOne(req.user.id);
  }

  @Patch('me')
  async updateMyProfile(@Req() req: RequestWithUser, @Body() updateData: any) {
    return this.profilesService.update(req.user.id, updateData);
  }
}
