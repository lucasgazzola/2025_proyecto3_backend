import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

export enum ProjectTypeEnum {
  COMMERCIAL = 'COMMERCIAL',
  MAINTENANCE = 'MAINTENANCE',
  PRODUCTION = 'PRODUCTION',
  SERVICES = 'SERVICES',
  CONSTRUCTION = 'CONSTRUCTION',
  TECHNOLOGY = 'TECHNOLOGY',
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ProjectTypeEnum), required: true })
  projectType: ProjectTypeEnum;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Claim' }], default: [] })
  claims: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
