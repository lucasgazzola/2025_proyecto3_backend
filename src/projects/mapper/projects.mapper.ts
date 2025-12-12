import { ProjectDocument } from '../../mongoose/schemas/project.schema';
import { UserDocument } from '../../mongoose/schemas/user.schema';
import { Types } from 'mongoose';

export class ProjectsMapper {
  static toResponse(project: ProjectDocument) {
    const user = project.user as UserDocument | Types.ObjectId;

    return {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      projectType: project.projectType,
      user:
        typeof user === 'object' && 'email' in user
          ? {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              phone: user.phone,
            }
          : null,
      claims: project.claims?.map((c) => c.toString()),
      registrationDate: project.registrationDate,
      isActive: project.isActive,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
    };
  }
}
