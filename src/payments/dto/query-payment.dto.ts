import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { SortOrder } from '../../courses/dto/query-course.dto';

export enum PaymentSortBy {
  CREATED_AT = 'created_at',
  AMOUNT = 'amount',
  STATUS = 'status',
}

export class QueryPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  @IsString()
  stripe_customer_id?: string;

  @IsOptional()
  @IsEnum(PaymentSortBy)
  sort_by?: PaymentSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;
}
