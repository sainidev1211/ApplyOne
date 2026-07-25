import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasExperience?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPosition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  expectedPackages?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lastMonthlyPackage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  noticePeriodDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workAuthorization?: string;
}
