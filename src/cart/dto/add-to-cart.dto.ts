import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum CartItemType {
  COURSE = 'COURSE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  RESOURCE = 'RESOURCE',
  CERTIFICATION = 'CERTIFICATION',
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
