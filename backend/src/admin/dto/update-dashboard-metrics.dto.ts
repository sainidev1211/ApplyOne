/**
 * Admin-managed dashboard metric values are presentation text. New writes use
 * strings so MongoDB preserves Unicode, emojis, symbols, and prose verbatim.
 * Existing numeric documents remain readable for backwards compatibility.
 */
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

export type DashboardMetricValue = string | number;

export class UpdateDashboardMetricsDto {
  @ApiPropertyOptional({ example: '150+' }) @IsOptional() @ValidateIf((_, value) => typeof value !== 'number') @IsString()
  applications?: DashboardMetricValue;
  @ApiPropertyOptional({ example: '37 🎯' }) @IsOptional() @ValidateIf((_, value) => typeof value !== 'number') @IsString()
  responses?: DashboardMetricValue;
  @ApiPropertyOptional({ example: 'Interviewing' }) @IsOptional() @ValidateIf((_, value) => typeof value !== 'number') @IsString()
  interviews?: DashboardMetricValue;
  @ApiPropertyOptional({ example: 'Application process is going well 🚀' }) @IsOptional() @ValidateIf((_, value) => typeof value !== 'number') @IsString()
  offers?: DashboardMetricValue;
  @ApiPropertyOptional({ example: '—' }) @IsOptional() @ValidateIf((_, value) => typeof value !== 'number') @IsString()
  rejected?: DashboardMetricValue;
  @ApiPropertyOptional({ example: 'Excellent!' }) @IsOptional() @ValidateIf((_, value) => typeof value !== 'number') @IsString()
  shortlisted?: DashboardMetricValue;
}

export class RemainingCreditsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  job?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  ai?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  resume?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  ats?: number;
}

export class UpdateUserDashboardDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  currentPlan?: string;
  @ApiPropertyOptional({ type: () => RemainingCreditsDto }) @IsOptional() @ValidateNested() @Type(() => RemainingCreditsDto)
  remainingCredits?: RemainingCreditsDto;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  jobsInProgress?: number;
  @ApiPropertyOptional() @IsOptional() @IsString()
  adminMessage?: string;
  @ApiPropertyOptional({ type: () => UpdateDashboardMetricsDto }) @IsOptional() @ValidateNested() @Type(() => UpdateDashboardMetricsDto)
  dashboardMetrics?: UpdateDashboardMetricsDto;
}
