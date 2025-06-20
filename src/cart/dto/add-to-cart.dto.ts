<<<<<<< HEAD
import { IsEnum, IsInt, IsNumber, Min } from 'class-validator';

export enum CartItemType {
  COURSE = 'course',
  RESOURCE = 'resource',
  CERTIFICATION = 'certification',
=======
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum CartItemType {
  COURSE = 'COURSE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  RESOURCE = 'RESOURCE',
  CERTIFICATION = 'CERTIFICATION'
>>>>>>> dev-backend
}

export class AddToCartDto {
  @IsEnum(CartItemType)
<<<<<<< HEAD
  itemType: CartItemType;

  @IsInt()
  itemId: number;

  @IsNumber()
  @Min(1)
  quantity: number = 1;
}
=======
  type: CartItemType;

  @IsNumber()
  itemId: number;

  @IsOptional()
  @IsString()
  couponCode?: string;
} 
>>>>>>> dev-backend
