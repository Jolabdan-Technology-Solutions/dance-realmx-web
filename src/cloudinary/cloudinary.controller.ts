import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.cloudinaryService.uploadFile(file, {
        folder: uploadFileDto.folder,
        resource_type: uploadFileDto.resource_type as any,
      });

      return {
        message: 'File uploaded successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Get(':publicId')
  async getFileInfo(@Param('publicId') publicId: string) {
    try {
      const result = await this.cloudinaryService.getFileInfo(publicId);
      return {
        message: 'File info retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new NotFoundException(`Failed to get file info: ${error.message}`);
    }
  }

  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    try {
      const result = await this.cloudinaryService.deleteFile(publicId);
      return {
        message: 'File deleted successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }
}
