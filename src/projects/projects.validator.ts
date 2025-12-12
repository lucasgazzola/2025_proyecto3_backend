import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './../mongoose/schemas/project.schema';

@Injectable()
export class ProjectsValidator {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async ensureExists(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Project not found');
    const project = await this.projectModel.findById(id).exec();
    if (!project)
      throw new NotFoundException(`El proyecto con id ${id} no existe`);
  }
}
