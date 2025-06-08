import { Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

type CloudinaryResourceType = 'auto' | 'image' | 'video' | 'raw';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private isConfigured = false;

  onModuleInit() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    console.log('Cloudinary Config Check:');
    console.log('CLOUDINARY_CLOUD_NAME exists:', !!cloudName);
    console.log('CLOUDINARY_API_KEY exists:', !!apiKey);
    console.log('CLOUDINARY_API_SECRET exists:', !!apiSecret);

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary configuration is incomplete. File uploads will be disabled.');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.isConfigured = true;
    console.log('Cloudinary configuration successful');
  }

  async uploadFile(
    file: Express.Multer.File,
    options: { folder?: string; resource_type?: CloudinaryResourceType } = {},
  ) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check your environment variables.');
    }

    try {
      const { folder = 'dance-realm', resource_type = 'auto' } = options;

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type,
            allowed_formats: [
              'jpg',
              'jpeg',
              'png',
              'gif',
              'pdf',
              'doc',
              'docx',
              'mp4',
              'mov',
              'mp3',
              'wav',
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (!result) {
              reject(
                new Error('Upload failed: No result returned from Cloudinary'),
              );
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                resource_type: result.resource_type,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                created_at: result.created_at,
              });
            }
          },
        );

        const stream = Readable.from(file.buffer);
        stream.pipe(uploadStream);
      });
    } catch (error) {
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  async deleteFile(publicId: string) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check your environment variables.');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (!result) {
        throw new Error(
          'Failed to delete file: No result returned from Cloudinary',
        );
      }
      return result;
    } catch (error) {
      throw new Error(
        `Failed to delete file from Cloudinary: ${error.message}`,
      );
    }
  }

  async getFileInfo(publicId: string) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please check your environment variables.');
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      if (!result) {
        throw new Error(
          'Failed to get file info: No result returned from Cloudinary',
        );
      }
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get file info from Cloudinary: ${error.message}`,
      );
    }
  }
}
