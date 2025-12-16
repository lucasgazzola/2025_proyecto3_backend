import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileDocument = File & Document;

export enum FileTypeEnum {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
}

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: String, enum: Object.values(FileTypeEnum), required: true })
  fileType: FileTypeEnum;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);
