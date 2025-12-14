import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    _id: string;
    name: string;
    subareas: { _id: string; name: string }[];
  }[]> {
    const areas = await this.areaModel.find().lean();
    const areaIds = areas.map((a) => a._id);
  
    const subareas = await this.subAreaModel
      .find({ area: { $in: areaIds } })
      .lean();
  
    const subareasByArea = new Map<string, { _id: string; name: string }[]>();
  
    for (const s of subareas) {
      const areaId = String(s.area);
      const list = subareasByArea.get(areaId) ?? [];
    
      list.push({
        _id: String(s._id),   // ✅ se mantiene _id
        name: s.name,
      });
    
      subareasByArea.set(areaId, list);
    }
  
    return areas.map((a) => ({
      _id: String(a._id),     // ✅ se mantiene _id
      name: a.name,
      subareas: subareasByArea.get(String(a._id)) ?? [],
    }));
  }

}
