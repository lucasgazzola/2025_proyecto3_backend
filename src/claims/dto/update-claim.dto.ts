import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClaimDto } from './create-claim.dto';
import { ClaimStatus } from '../../common/enums/claims.enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateClaimDto extends PartialType(CreateClaimDto) {
	@ApiProperty({ example: ClaimStatus.IN_PROGRESS, required: false, enum: ClaimStatus })
  @IsOptional()
	@IsEnum(ClaimStatus)
	claimStatus?: ClaimStatus;

  @ApiProperty({ example: 'Website for client X', required: true })
	@IsString()
	actions: string;

  @ApiProperty({ example: 'Frontend', required: false })
	@IsOptional()
	@IsString()
	area?: string;

  @ApiProperty({ example: 'UI', required: false })
	@IsOptional()
	@IsString()
	subarea?: string;

  @ApiProperty({ example: 'Final resolution details', required: false })
  @IsOptional()
  @IsString()
  finalResolution?: string;
}
