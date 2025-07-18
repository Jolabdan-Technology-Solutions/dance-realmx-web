import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum CartItemType {
  COURSE = 'COURSE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  RESOURCE = 'RESOURCE',
  CERTIFICATION = 'CERTIFICATION',
  LESSON = 'LESSON',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  INTERACTIVE = 'INTERACTIVE',
  LESSON_PLAN = 'LESSON_PLAN',
  CHOREOGRAPHY = 'CHOREOGRAPHY',
}

export class AddToCartDto {
  @IsEnum(CartItemType)
  type: CartItemType;

  @IsNumber()
  itemId: number;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
