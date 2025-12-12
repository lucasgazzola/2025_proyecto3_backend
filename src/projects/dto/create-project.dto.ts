import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectType } from '../../common/enums/projects.enums';

export class CreateProjectDto {
  @ApiProperty({ example: 'New Website', description: 'Project title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Website for client X', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ProjectType.TECHNOLOGY, enum: ProjectType })
  @IsEnum(ProjectType)
  projectType: ProjectType;
}
