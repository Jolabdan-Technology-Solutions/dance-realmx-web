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
import { PrismaService } from '../prisma/prisma.service';
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
    sub: number | string;
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
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    console.log('Getting profile for user:', req.user);
    console.log('User ID (sub):', req.user.sub, 'Type:', typeof req.user.sub);

    // Convert sub to number if it's a string
    const userId =
      typeof req.user.sub === 'string'
        ? parseInt(req.user.sub, 10)
        : req.user.sub;

    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID in token');
    }

    return this.profilesService.findOne(userId);
  }

  @Patch('me')
  async updateMyProfile(
    @Req() req: RequestWithUser,
    @Body() updateData: UpdateProfileDto,
  ) {
    const userId =
      typeof req.user.sub === 'string'
        ? parseInt(req.user.sub, 10)
        : req.user.sub;
    return this.profilesService.update(userId, updateData);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('=== Profile Image Upload Started ===');
    console.log('Request user:', {
      sub: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    });
    console.log(
      'File received:',
      file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            fieldname: file.fieldname,
          }
        : 'No file',
    );

    // Validate file exists
    if (!file) {
      console.error('Upload failed: No file provided');
      throw new BadRequestException('No file uploaded. Please select a file.');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.error('Upload failed: Invalid file type', {
        mimetype: file.mimetype,
      });
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('Upload failed: File too large', {
        size: file.size,
        maxSize,
      });
      throw new BadRequestException(`File too large. Maximum size: 10MB`);
    }

    // Validate user ID
    if (!req.user.sub) {
      console.error('Upload failed: No user ID in token');
      throw new BadRequestException('Invalid authentication token');
    }

    try {
      // Convert user ID to number
      const userId =
        typeof req.user.sub === 'string'
          ? parseInt(req.user.sub, 10)
          : req.user.sub;

      if (!userId || isNaN(userId)) {
        console.error('Upload failed: Invalid user ID', {
          sub: req.user.sub,
          userId,
        });
        throw new BadRequestException('Invalid user ID in token');
      }

      console.log('Processing upload for user ID:', userId);

      // Verify user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, profile_image_url: true },
      });

      if (!existingUser) {
        console.error('Upload failed: User not found', { userId });
        throw new BadRequestException('User not found');
      }

      console.log('User found:', {
        id: existingUser.id,
        email: existingUser.email,
        currentImageUrl: existingUser.profile_image_url,
      });

      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const cloudinaryResult = (await this.cloudinaryService.uploadFile(
        file,
      )) as {
        secure_url: string;
        public_id: string;
      };

      if (!cloudinaryResult || !cloudinaryResult.secure_url) {
        console.error('Upload failed: Cloudinary upload failed', {
          cloudinaryResult,
        });
        throw new BadRequestException('Failed to upload file to cloud storage');
      }

      console.log('Cloudinary upload successful:', {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
      });

      // Update user profile image URL
      console.log('Updating user profile image URL...');
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { profile_image_url: cloudinaryResult.secure_url },
        select: {
          id: true,
          email: true,
          profile_image_url: true,
          updated_at: true,
        },
      });

      console.log('User updated successfully:', {
        id: updatedUser.id,
        profile_image_url: updatedUser.profile_image_url,
        updated_at: updatedUser.updated_at,
      });

      // Return response with debugging info
      const response = {
        url: cloudinaryResult.secure_url,
        user: {
          id: updatedUser.id,
          profile_image_url: updatedUser.profile_image_url,
        },
        uploadInfo: {
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          cloudinaryPublicId: cloudinaryResult.public_id,
        },
      };

      console.log('=== Profile Image Upload Completed Successfully ===');
      console.log('Response:', response);

      return response;
    } catch (error) {
      console.error('=== Profile Image Upload Failed ===');
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Handle specific error types
      if (error.code === 'P2025') {
        console.error('Database error: Record not found');
        throw new BadRequestException('User not found in database');
      }

      if (error.code === 'P2002') {
        console.error('Database error: Unique constraint violation');
        throw new BadRequestException('Database constraint violation');
      }

      if (error.message.includes('Cloudinary is not configured')) {
        console.error('Cloudinary configuration error');
        throw new BadRequestException(
          'File upload service is not configured. Please contact support.',
        );
      }

      if (error.message.includes('Invalid file')) {
        console.error('File validation error');
        throw new BadRequestException(error.message);
      }

      // Generic error handling
      console.error('Unexpected error during upload');
      throw new BadRequestException(`Upload failed: ${error.message}`);
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
  @UseGuards(RolesGuard)
  @Roles(Role.BOOKING_USER)
  // @RequireFeature(Feature.CONTACT_BOOK)
  async bookProfessional(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() bookingDto: any,
  ) {
    return this.profilesService.bookProfessionalById(
      id,
      req.user.id,
      bookingDto,
    );
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
  async findByPricing(@Query('price_max') price_max: number) {
    return this.profilesService.findProfessionalsByPricing(price_max);
  }

  @Post('professionals/search')
  async searchProfessionals(
    @Body(new ValidationPipe({ transform: true }))
    body: SearchProfessionalsDto,
  ) {
    console.log('Received body:', body);
    console.log('Types:', {
      travel_distance: typeof body.travel_distance,
      pricing: typeof body.pricing,
      session_duration: typeof body.session_duration,
    });
    return this.profilesService.searchProfessionals(body);
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
