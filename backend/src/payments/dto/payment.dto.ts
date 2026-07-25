import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  provider!: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  successUrl!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cancelUrl!: string;
}

export class RefundPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
