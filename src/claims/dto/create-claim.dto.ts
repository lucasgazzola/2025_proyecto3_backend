import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ClaimPriority,
  ClaimCriticality,
  ClaimType,
} from '../../common/enums/claims.enums';

export class CreateClaimDto {
  @ApiProperty({ example: 'CLM-001', description: 'Unique claim code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'System crashes when saving',
    description: 'Description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Partial fix applied', required: false })
  @IsOptional()
  @IsString()
  finalResolution?: string;

  @ApiProperty({
    example: '64a1f2...',
    description: 'Project ObjectId as string',
  })
  @IsString()
  project: string;

  @ApiProperty({ example: '64b2e3...', description: 'User ObjectId as string' })
  @IsString()
  user: string;

  @ApiProperty({ example: ClaimPriority.MEDIUM, enum: ClaimPriority })
  @IsEnum(ClaimPriority)
  priority: ClaimPriority;

  @ApiProperty({ example: ClaimCriticality.MAJOR, enum: ClaimCriticality })
  @IsEnum(ClaimCriticality)
  severity: ClaimCriticality;

  @ApiProperty({ example: ClaimType.TECHNICAL, enum: ClaimType })
  @IsEnum(ClaimType)
  claimType: ClaimType;

  @ApiProperty({ example: '64c3d4...', description: 'Area ObjectId as string' })
  @IsString()
  area: string;

  @ApiProperty({
    example: '64d4e5...',
    required: false,
    description: 'File ObjectId as string',
  })
  @IsOptional()
  @IsString()
  file?: string;
}
