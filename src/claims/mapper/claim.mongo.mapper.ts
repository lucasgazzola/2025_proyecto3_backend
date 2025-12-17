import { Types } from 'mongoose';
import { ClaimDocument } from 'src/mongoose/schemas/claim.schema';
import { ClaimStateHistoryDocument } from 'src/mongoose/schemas/claim-state-history.schema';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { UpdateClaimDto } from '../dto/update-claim.dto';
import {
  ClaimPriority,
  ClaimCriticality,
  ClaimType,
  ClaimStatus,
} from '../../common/enums/claims.enums';

export class ClaimMapper {
  static toCreatePersistence(dto: CreateClaimDto, userId: string): Partial<ClaimDocument> {
    return {
      description: dto.description,
      project: new Types.ObjectId(dto.project),
      user: new Types.ObjectId(userId),
    };
  }

  static toUpdatePersistence(dto: UpdateClaimDto): { project?: Types.ObjectId; subarea?: Types.ObjectId } {
    const data: { project?: Types.ObjectId; subarea?: Types.ObjectId } = {};

    if (dto.project && Types.ObjectId.isValid(dto.project)) {
      data.project = new Types.ObjectId(dto.project);
    }

    if (dto.subarea && Types.ObjectId.isValid(dto.subarea)) {
      data.subarea = new Types.ObjectId(dto.subarea);
    }

    return data;
  }

  static toCreateHistoryPersistence(params: {
    action: string;
    claimId: string;
    userId: string;
    claimStatus?: ClaimStatus;
    priority?: ClaimPriority;
    criticality?: ClaimCriticality;
    claimType?: ClaimType;
    subarea?: string;
  }): Partial<ClaimStateHistoryDocument> {
    const history: Partial<ClaimStateHistoryDocument> = {
      action: params.action,
      startTime: new Date(),
      startDate: new Date(),
      claim: new Types.ObjectId(params.claimId),
      user: new Types.ObjectId(params.userId),
    };

    if (params.claimStatus) history.claimStatus = params.claimStatus;
    if (params.priority) history.priority = params.priority;
    if (params.criticality) history.criticality = params.criticality;
    if (params.claimType) history.claimType = params.claimType;
    if (params.subarea && Types.ObjectId.isValid(params.subarea)) {
      history.subarea = new Types.ObjectId(params.subarea);
    }

    return history;
  }
}

