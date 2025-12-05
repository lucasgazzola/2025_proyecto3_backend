import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClaimDocument = Claim & Document;

export enum ClaimPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ClaimCriticalityEnum {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
  BLOCKER = 'BLOCKER',
}

export enum ClaimTypeEnum {
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Claim {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  finalResolution?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ClaimPriorityEnum), required: true })
  priority: ClaimPriorityEnum;

  @Prop({ type: String, enum: Object.values(ClaimCriticalityEnum), required: true })
  severity: ClaimCriticalityEnum;

  @Prop({ type: String, enum: Object.values(ClaimTypeEnum), required: true })
  claimType: ClaimTypeEnum;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  area: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'File' })
  file?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ClaimStateHistory' }], default: [] })
  history: Types.ObjectId[];
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
