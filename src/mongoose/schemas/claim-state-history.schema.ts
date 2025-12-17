import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  ClaimPriority,
  ClaimCriticality,
  ClaimType,
  ClaimStatus,
} from '../../common/enums/claims.enums';

export type ClaimStateHistoryDocument = ClaimStateHistory & Document;

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

  @Prop({ type: String, enum: Object.values(ClaimStatus), required: true })
  claimStatus: ClaimStatus;

  @Prop({ type: String, enum: Object.values(ClaimType), required: true })
  claimType: ClaimType;

  @Prop({ type: String, enum: Object.values(ClaimPriority), required: true })
  priority: ClaimPriority;

  @Prop({ type: String, enum: Object.values(ClaimCriticality), required: true })
  criticality: ClaimCriticality;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubArea' })
  subarea?: Types.ObjectId;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ClaimStateHistorySchema = SchemaFactory.createForClass(ClaimStateHistory);
