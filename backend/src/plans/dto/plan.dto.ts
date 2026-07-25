import { IsString, IsNumber, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  monthlyPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yearlyPrice?: number;

  @ApiProperty()
  @IsNumber()
  jobCredits!: number;

  @ApiProperty()
  @IsNumber()
  aiCredits!: number;

  @ApiProperty()
  @IsNumber()
  resumeCredits!: number;

  @ApiProperty()
  @IsNumber()
  atsCredits!: number;

  @ApiProperty()
  @IsNumber()
  maxApplications!: number;

  @ApiProperty()
  @IsObject()
  features!: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  atsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdatePlanDto extends CreatePlanDto {}
