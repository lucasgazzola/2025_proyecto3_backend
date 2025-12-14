import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClaimDto } from './create-claim.dto';
import { ClaimCriticality, ClaimPriority, ClaimStatus, ClaimType } from '../../common/enums/claims.enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateClaimDto extends PartialType(CreateClaimDto) {
	@ApiProperty({ example: ClaimStatus.IN_PROGRESS, required: false, enum: ClaimStatus })
  @IsOptional()
	@IsEnum(ClaimStatus)
	claimStatus?: ClaimStatus;

	@ApiProperty({ example: ClaimPriority.MEDIUM, enum: ClaimPriority })
	@IsOptional()
	@IsEnum(ClaimPriority)
	priority: ClaimPriority;

	@ApiProperty({ example: ClaimCriticality.MAJOR, enum: ClaimCriticality })
	@IsOptional()
	@IsEnum(ClaimCriticality)
	criticality: ClaimCriticality;

	@ApiProperty({ example: ClaimType.TECHNICAL, enum: ClaimType })
	@IsOptional()
	@IsEnum(ClaimType)
	claimType: ClaimType;

  @ApiProperty({ example: 'Website for client X', required: true })
	@IsString()
	actions: string;

  @ApiProperty({ example: 'UI', required: false })
	@IsOptional()
	@IsString()
	subarea?: string;
}
