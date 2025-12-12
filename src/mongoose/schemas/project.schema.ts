import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project &
  Document & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    registrationDate: Date;
    isActive: boolean;
  };

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

  @Prop({ default: Date.now })
  registrationDate: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
