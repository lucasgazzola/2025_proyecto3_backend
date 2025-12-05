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

  @Prop({ type: String, enum: Object.values(FileTypeEnum), required: true })
  fileType: FileTypeEnum;
}

export const FileSchema = SchemaFactory.createForClass(File);
