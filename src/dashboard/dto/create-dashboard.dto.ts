import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDashboardDto {
  @ApiProperty({ example: 'Main Dashboard', description: 'Dashboard title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Shows overall metrics', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
