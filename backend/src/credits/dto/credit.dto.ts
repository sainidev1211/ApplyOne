import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCreditsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  feature!: 'resumeCredits' | 'atsCredits' | 'aiCredits' | 'jobCredits';

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class DeductCreditsDto extends AddCreditsDto {}
