import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClaimMessageDocument = ClaimMessage & Document;

export enum ClaimMessageStateEnum {
  PRIVATE = 'PRIVADO',
  PUBLIC = 'PUBLICO',
}

@Schema({ timestamps: true })
export class ClaimMessage {
  @Prop({ type: Types.ObjectId, ref: 'Claim', required: true })
  claim: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: Object.values(ClaimMessageStateEnum), required: true })
  state: ClaimMessageStateEnum;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ClaimMessageSchema = SchemaFactory.createForClass(ClaimMessage);
