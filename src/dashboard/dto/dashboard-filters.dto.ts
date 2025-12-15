import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ClaimStatus, ClaimType } from '../../common/enums/claims.enums';
import { ProjectTypeEnum } from '../../mongoose/schemas/project.schema';

export class DashboardFiltersDto {
  @ApiPropertyOptional({ description: 'Fecha inicial ISO (inclusive)', example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Fecha final ISO (inclusive)', example: '2025-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'IDs de proyectos a filtrar', type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  projectIds?: string[];

  @ApiPropertyOptional({ description: 'Tipo de proyecto', enum: ProjectTypeEnum })
  @IsOptional()
  @IsEnum(ProjectTypeEnum)
  projectType?: ProjectTypeEnum;

  @ApiPropertyOptional({ description: 'ID de área', type: String })
  @IsOptional()
  @IsMongoId()
  areaId?: string;

  @ApiPropertyOptional({ description: 'ID de subárea', type: String })
  @IsOptional()
  @IsMongoId()
  subareaId?: string;

  @ApiPropertyOptional({ description: 'ID de responsable (user)', type: String })
  @IsOptional()
  @IsMongoId()
  responsibleUserId?: string;

  @ApiPropertyOptional({ description: 'Tipo de reclamo', enum: ClaimType })
  @IsOptional()
  @IsEnum(ClaimType)
  claimType?: ClaimType;

  @ApiPropertyOptional({ description: 'Estado (para filtros de estado actual)', enum: ClaimStatus })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiPropertyOptional({ description: 'Cliente (solo ADMIN/AUDITOR)', type: String })
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Proyecto específico', type: String })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Texto libre para búsqueda en descripción', type: String })
  @IsOptional()
  @IsString()
  search?: string;
}
