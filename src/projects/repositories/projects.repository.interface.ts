import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Project } from '../../mongoose/schemas/project.schema';

export const IProjectsRepositoryToken = 'IProjectsRepository';

export interface IProjectsRepository {
  create(dto: CreateProjectDto): Promise<Project>;
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  update(id: string, dto: UpdateProjectDto): Promise<Project | null>;
  softDelete(id: string): Promise<Project | null>;
}
