import { IsEnum, IsInt, IsNumber, Min } from 'class-validator';

export enum CartItemType {
  COURSE = 'course',
  RESOURCE = 'resource',
  CERTIFICATION = 'certification',
}

export class AddToCartDto {
  @IsEnum(CartItemType)
  itemType: CartItemType;

  @IsInt()
  itemId: number;

  @IsNumber()
  @Min(1)
  quantity: number = 1;
}
