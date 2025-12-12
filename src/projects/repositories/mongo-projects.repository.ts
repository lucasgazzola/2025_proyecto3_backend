import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Project,
  ProjectDocument,
} from '../../mongoose/schemas/project.schema';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { IProjectsRepository } from './projects.repository.interface';

@Injectable()
export class MongoProjectsRepository implements IProjectsRepository {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const created = new this.projectModel({
      ...dto,
      registrationDate: new Date(),
      isActive: true,
    });
    return created.save();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel
      .find({ deletedAt: { $in: [null, undefined] }, isActive: true })
      .populate('user')
      .exec();
  }

  async findById(id: string): Promise<Project | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.projectModel.findById(id).populate('user').exec();
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project | null> {
    return this.projectModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('user')
      .exec();
  }

  async softDelete(id: string): Promise<Project | null> {
    return this.projectModel
      .findByIdAndUpdate(
        id,
        { deletedAt: new Date(), isActive: false },
        { new: true },
      )
      .populate('user')
      .exec();
  }
}
