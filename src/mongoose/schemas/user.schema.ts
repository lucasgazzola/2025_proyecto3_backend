import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum RoleEnum {
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone?: string;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'SubArea', required: false, default: null })
  subArea: Types.ObjectId;
 
  @Prop({ type: String, enum: Object.values(RoleEnum), default: RoleEnum.USER })
  role: RoleEnum;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }], default: [] })
  projects: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'ClaimStateHistory' }],
    default: [],
  })
  claimHistories: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Claim' }], default: [] })
  claims: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
