import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RoleEnum } from '../mongoose/schemas/user.schema';

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

  async findAllForUser(user: any): Promise<any[]> {
    const baseQuery: any = { deletedAt: { $exists: false } };

    if (user?.role === RoleEnum.CUSTOMER) {
      baseQuery.user = new Types.ObjectId(user.id || user._id);
    }

    const projects = await this.projectModel
      .find(baseQuery)
      .populate({ path: 'user', select: 'email firstName lastName role phone' })
      .populate({
        path: 'claims',
        select: 'code description claimType priority criticality area createdAt updatedAt',
        populate: [
          { path: 'area', select: 'name' },
          { path: 'user', select: 'email firstName lastName role phone' },
        ],
      })
      .lean()
      .exec();

    return projects.map((doc: any) => {
      const { _id, user, claims, ...rest } = doc;
      const mappedUser = user
        ? {
            id: user._id?.toString?.() ?? user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
          }
        : undefined;
      const mappedClaims = Array.isArray(claims)
        ? claims.map((c: any) => ({
            id: c._id?.toString?.() ?? c.id,
            code: c.code,
            description: c.description,
            claimType: c.claimType,
            priority: c.priority,
            criticality: c.criticality,
            area: c.area?.name ?? c.area,
            user: c.user
              ? {
                  id: c.user._id?.toString?.() ?? c.user.id,
                  email: c.user.email,
                  firstName: c.user.firstName,
                  lastName: c.user.lastName,
                  role: c.user.role,
                  phone: c.user.phone,
                }
              : undefined,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }))
        : undefined;
      return {
        id: _id.toString(),
        ...rest,
        ...(mappedUser && { user: mappedUser }),
        ...(mappedClaims && { claims: mappedClaims }),
      };
    });
  }


  async findAll() {
    return this.projectModel.find({ deletedAt: { $exists: false } }).exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Project not found');
    return this.projectModel.findById(id).exec();
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
