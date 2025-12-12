import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsMapper } from './mapper/projects.mapper';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    // Acá podrías almacenar el userId si querés
    const created = new this.projectModel({
      ...createProjectDto,
      createdBy: userId,
    });

    const project = await created.save();
    return ProjectsMapper.toResponse(project);
  }

  async findAll() {
    const projects = await this.projectModel
      .find({ deletedAt: { $in: [null, undefined] } })
      .exec();

    return projects.map((project) => ProjectsMapper.toResponse(project));
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Project not found');

    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');

    return ProjectsMapper.toResponse(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Project not found');

    const project = await this.projectModel
      .findByIdAndUpdate(
        id,
        {
          ...updateProjectDto,
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();

    if (!project) throw new NotFoundException('Project not found');

    return ProjectsMapper.toResponse(project);
  }

  async remove(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Project not found');

    const project = await this.projectModel
      .findByIdAndUpdate(
        id,
        {
          deletedAt: new Date(),
          deletedBy: userId,
        },
        { new: true },
      )
      .exec();

    if (!project) throw new NotFoundException('Project not found');

    return ProjectsMapper.toResponse(project);
  }
}
