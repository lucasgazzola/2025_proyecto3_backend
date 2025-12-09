import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubArea, SubAreaDocument } from '../mongoose/schemas/subarea.schema';
import { Area, AreaDocument } from '../mongoose/schemas/area.schema';

@Injectable()
export class SubareasService {
  constructor(
    @InjectModel(SubArea.name)
    private readonly subareaModel: Model<SubAreaDocument>,
    @InjectModel(Area.name)
    private readonly areaModel: Model<AreaDocument>,
  ) {}

  async findByArea(areaId: string) {
    if (!Types.ObjectId.isValid(areaId)) {
      throw new NotFoundException('Invalid area id');
    }

    const area = await this.areaModel.findById(areaId).exec();

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return this.subareaModel.find({ area: areaId }).exec();
  }
}
