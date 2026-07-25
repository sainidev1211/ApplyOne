import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  percentageDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fixedDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minimumAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxUsage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  perUserLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePlans?: string[];
}

export class UpdateCouponDto extends CreateCouponDto {}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;
}
