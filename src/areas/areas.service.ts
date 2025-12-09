import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area, AreaDocument } from '../mongoose/schemas/area.schema';

@Injectable()
export class AreasService {
  constructor(
    @InjectModel(Area.name)
    private readonly areaModel: Model<AreaDocument>,
  ) {}

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid area id');
    }

    const area = await this.areaModel.findById(id).populate('subAreas').exec();

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return area;
  }
}
