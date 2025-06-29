import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User } from '@prisma/client';
import { UpdateProfileDto } from './update-profile.dto';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';
import { Feature } from '../auth/enums/feature.enum';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Roles, RolesGuard } from '@/auth/guards/roles.guard';
import { Role } from '@/auth/enums/role.enum';

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
  async updateMyProfile(
    @Req() req: RequestWithUser,
    @Body() updateData: UpdateProfileDto,
  ) {
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
      const result = (await this.cloudinaryService.uploadFile(file)) as {
        secure_url: string;
      };
      await this.profilesService.update(req.user.sub, {
        profile_image_url: result.secure_url,
      });
      return { url: result.secure_url };
    } catch (error) {
      if (error.message.includes('Cloudinary is not configured')) {
        throw new BadRequestException(
          'File upload service is not configured. Please contact support.',
        );
      }
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Post('become-professional')
  // @RequireSubscription('R')
  @UseGuards(RolesGuard)
  @Roles(Role.BOOKING_PROFESSIONAL)
  async becomeProfessional(
    @Req() req: { user: User },
    @Body() profileData: UpdateProfileDto,
  ) {
    return this.profilesService.becomeProfessional(req.user.id, profileData);
  }

  @Post(':id/book')
  @UseGuards(FeatureGuard)
  @RequireFeature(Feature.CONTACT_BOOK)
  async bookProfessional(@Param('id') id: string, @Req() req: { user: User }) {
    return this.profilesService.bookProfessional(id, req.user.id);
  }

  @Get('professionals')
  @UseGuards(FeatureGuard)
  @RequireFeature(Feature.SEARCH_PROFESSIONALS)
  async getProfessionals() {
    return this.profilesService.getProfessionals();
  }

  @Get('professionals/by-location')
  async findByLocation(@Query('location') location: string) {
    return this.profilesService.findProfessionalsByLocation(location);
  }

  @Get('professionals/by-dance-style')
  async findByDanceStyle(@Query('danceStyle') danceStyle: string) {
    return this.profilesService.findProfessionalsByDanceStyle(danceStyle);
  }

  @Get('professionals/by-category')
  async findByCategory(@Query('category') category: string) {
    return this.profilesService.findProfessionalsByCategory(category);
  }

  @Get('professionals/by-state')
  async findByState(@Query('state') state: string) {
    return this.profilesService.findProfessionalsByState(state);
  }

  @Get('professionals/by-city')
  async findByCity(@Query('city') city: string) {
    return this.profilesService.findProfessionalsByCity(city);
  }

  @Get('professionals/by-date')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.profilesService.findProfessionalsByDateRange(
      startDate,
      endDate,
    );
  }

  @Get('professionals/by-pricing')
  async findByPricing(@Query('min') min: number, @Query('max') max: number) {
    return this.profilesService.findProfessionalsByPricing(min, max);
  }

  @Get('professionals/search')
  async searchProfessionals(
    @Query(new ValidationPipe({ transform: true }))
    query: SearchProfessionalsDto,
  ) {
    console.log('Received query:', query);
    console.log('Types:', {
      travel_distance: typeof query.travel_distance,
      pricing: typeof query.pricing,
      session_duration: typeof query.session_duration,
    });
    return this.profilesService.searchProfessionals(query);
  }

  @Post('professionals/:id/book')
  async bookProfessionalById(
    @Param('id') id: string,
    @Body() bookingDto: any,
    @Req() req: { user: User },
  ) {
    return this.profilesService.bookProfessionalById(
      id,
      req.user.id,
      bookingDto,
    );
  }
}
