import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredRoles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredIndustries?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCompanySize?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  openToRemote?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  openToHybrid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  openToOnsite?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  employmentTypes?: EmploymentType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minimumSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maximumSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visaSponsorshipNeeded?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredExperience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredShift?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  automationEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dailyEmailAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  applicationAlerts?: boolean;
}
