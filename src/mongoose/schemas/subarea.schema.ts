import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubAreaDocument = SubArea & Document;

@Schema({ timestamps: true })
export class SubArea {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  area: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Claim' }], default: [] })
  claims: Types.ObjectId[];

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const SubAreaSchema = SchemaFactory.createForClass(SubArea);
