import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ClaimPriorityEnum, ClaimCriticalityEnum } from './claim.schema';

export type ClaimStateHistoryDocument = ClaimStateHistory & Document;

export enum ClaimStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class ClaimStateHistory {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Claim', required: true })
  claim: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ClaimStatusEnum), required: true })
  claimState: ClaimStatusEnum;

  @Prop({ type: String, enum: Object.values(ClaimPriorityEnum), required: true })
  priority: ClaimPriorityEnum;

  @Prop({ type: String, enum: Object.values(ClaimCriticalityEnum), required: true })
  severity: ClaimCriticalityEnum;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ClaimStateHistorySchema = SchemaFactory.createForClass(ClaimStateHistory);
