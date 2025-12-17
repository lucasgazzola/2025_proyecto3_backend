import { Types } from 'mongoose';
import { ClaimDocument } from 'src/mongoose/schemas/claim.schema';

export const CLAIM_REPOSITORY = 'CLAIM_REPOSITORY' as const;

export interface IClaimRepository {
  create(data: Partial<ClaimDocument>): Promise<ClaimDocument>;

  findAll(query: Record<string, unknown>): Promise<ClaimPopulated[]>;

  findById(id: string): Promise<ClaimPopulated | null>;

  updateBase(
    id: string,
    data: { project?: Types.ObjectId; subarea?: Types.ObjectId },
  ): Promise<ClaimDocument | null>;

  delete(id: string): Promise<void>;

  pushHistory(claimId: Types.ObjectId, historyId: Types.ObjectId): Promise<void>;

  pushFiles(claimId: Types.ObjectId, fileIds: Types.ObjectId[]): Promise<void>;
}

// Tipo auxiliar para resultados con populate
export type ClaimPopulated = {
  _id: Types.ObjectId;
  description?: string;
  project?: {
    _id: Types.ObjectId;
    name?: string;
    user?: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phone?: string;
    };
  };
  user?: any;
  history?: any[];
  files?: (Types.ObjectId | { _id: Types.ObjectId; name: string; fileType: string; url: string })[];
};

