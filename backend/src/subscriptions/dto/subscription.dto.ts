import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  planId!: string;
}

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
