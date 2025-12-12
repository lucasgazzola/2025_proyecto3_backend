import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area, AreaDocument } from '../../mongoose/schemas/area.schema';
import { SubArea, SubAreaDocument } from '../../mongoose/schemas/subarea.schema';
import type { IAreasRepository } from './areas.repository.interface';

export class AreasMongoRepository implements IAreasRepository {
  constructor(
    @InjectModel(Area.name) private readonly areaModel: Model<AreaDocument>,
    @InjectModel(SubArea.name)
    private readonly subAreaModel: Model<SubAreaDocument>,
  ) {}

  async findAll(): Promise<{
    id: string;
    name: string;
    subareas: { id: string; name: string }[];
  }[]> {
    const areas = await this.areaModel.find().lean();
    const areaIds = areas.map((a) => a._id);

    const subareas = await this.subAreaModel
      .find({ area: { $in: areaIds } })
      .lean();

    const subareasByArea = new Map<string, { id: string; name: string }[]>();
    for (const s of subareas) {
      const areaId = String(s.area);
      const list = subareasByArea.get(areaId) ?? [];
      list.push({ id: String(s._id), name: s.name });
      subareasByArea.set(areaId, list);
    }

    return areas.map((a) => ({
      id: String(a._id),
      name: a.name,
      subareas: subareasByArea.get(String(a._id)) ?? [],
    }));
  }
}
