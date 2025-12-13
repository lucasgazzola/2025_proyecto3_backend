import { PartialType } from '@nestjs/swagger';
import { CreateClaimDto } from './create-claim.dto';
import { ClaimStatus } from '../../common/enums/claims.enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateClaimDto extends PartialType(CreateClaimDto) {
	@IsOptional()
	@IsEnum(ClaimStatus)
	claimStatus?: ClaimStatus;

	@IsOptional()
	@IsString()
	actions?: string;

	@IsOptional()
	@IsString()
	area?: string;

	@IsOptional()
	@IsString()
	subarea?: string;

	@IsOptional()
	@IsString()
	project?: string;


  @IsOptional()
  @IsString()
  finalResolution?: string;
}
