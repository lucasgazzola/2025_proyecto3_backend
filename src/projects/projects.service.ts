import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RoleEnum } from '../mongoose/schemas/user.schema';
import { ProjectResponseDto } from './dto/project-response.dto';
import { projectMapper } from './mapper/project.mapper'; 

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

async createForUser(user: any, createProjectDto: CreateProjectDto) {
  const created = new this.projectModel({
    title: createProjectDto.title,
    description: createProjectDto.description,
    projectType: createProjectDto.projectType,
    user: new Types.ObjectId(user.id || user._id),
  });
  return created.save();
}


async findAllForUser(user: any): Promise<ProjectResponseDto[]> {
  const baseQuery: any = { deletedAt: { $exists: false } };

  if (user?.role === RoleEnum.CUSTOMER) {
    baseQuery.user = new Types.ObjectId(user.id || user._id);
  }

  const projects = await this.projectModel
    .find(baseQuery)
    .populate({ path: 'user', select: 'email firstName lastName role phone' })
    .populate({
      path: 'claims',
      select: 'description claimType priority criticality subarea createdAt updatedAt',
      populate: [
        { path: 'subarea', select: 'name area', populate: { path: 'area', select: 'name' } },
        { path: 'user', select: 'email firstName lastName role phone' },
      ],
    })
    .lean()
    .exec();

  return projects.map(projectMapper);
}


async findAll(): Promise<ProjectResponseDto[]> {
  const projects = await this.projectModel.find({ deletedAt: { $exists: false } }).lean().exec();
  return projects.map(projectMapper);
}

async findOne(id: string): Promise<ProjectResponseDto> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Project not found');
  const project = await this.projectModel.findById(id).lean().exec();
  if (!project) throw new NotFoundException('Project not found');
  return projectMapper(project);
}
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto as any, { new: true }).exec();
  }

  async softDelete(id: string) {
    return this.projectModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }
}
