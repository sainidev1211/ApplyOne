import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResumeDto {
  @ApiPropertyOptional({
    description: 'Set to true to make this the active/default resume',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
