import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ClaimPriority,
  ClaimCriticality,
  ClaimType,
  ClaimStatus,
} from '../../common/enums/claims.enums';

export class CreateClaimDto {
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

  @ApiProperty({ example: ClaimStatus.PENDING, enum: ClaimStatus, required: false })
  @IsEnum(ClaimStatus)
  @IsOptional()
  claimStatus?: ClaimStatus;   // ✅ agregado

  @ApiProperty({
    example: '64a1f2...',
    description: 'Subarea ObjectId as string',
    required: false,
  })
  @IsString()
  @IsOptional()
  subarea?: string;            // ✅ agregado

  // Los archivos se envían vía multipart/form-data en el endpoint y no forman parte del DTO JSON.
}
