import { ProjectDocument } from '../../mongoose/schemas/project.schema';
import { ProjectResponseDto } from '../dto/project-response.dto';

export const projectMapper = (doc: ProjectDocument | any): ProjectResponseDto => {
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
        id: c._id.toString(),
        description: c.description,
        claimType: c.claimType,
        priority: c.priority,
        criticality: c.criticality,
        area: c?.subarea?.area?.name ?? undefined,
        subarea: c?.subarea
          ? { id: c.subarea._id?.toString?.(), name: c.subarea.name }
          : undefined,
        user: c.user
          ? {
              id: c.user._id.toString(),
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
};
