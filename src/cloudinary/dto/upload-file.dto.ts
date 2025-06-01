import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum ResourceType {
  AUTO = 'auto',
  IMAGE = 'image',
  VIDEO = 'video',
  RAW = 'raw',
}

export class UploadFileDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  resource_type?: ResourceType;
}
