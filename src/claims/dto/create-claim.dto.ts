import { ClaimStatus } from './../../common/enums/claims.enums';
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

  @ApiProperty({
    example: '64a1f2...',
    description: 'Project ObjectId as string',
  })
  @IsString()
  project: string;

  @ApiProperty({ example: ClaimPriority.MEDIUM, enum: ClaimPriority })
  @IsEnum(ClaimPriority)
  priority: ClaimPriority;

  @ApiProperty({ example: ClaimCriticality.MAJOR, enum: ClaimCriticality })
  @IsEnum(ClaimCriticality)
  criticality: ClaimCriticality;

  @ApiProperty({ example: ClaimType.TECHNICAL, enum: ClaimType })
  @IsEnum(ClaimType)
  claimType: ClaimType;

  @ApiProperty({
    example: '64d4e5...',
    required: false,
    description: 'File ObjectId as string',
  })
  @IsOptional()
  @IsString()
  file?: string;
}
