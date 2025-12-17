export class ProjectResponseDto {
  id: string;
  title: string;
  description?: string;
  projectType: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  };
  claims?: {
    id: string;
    description: string;
    claimType: string;
    priority: string;
    criticality: string;
    area?: string;
    subarea?: { id: string; name: string };
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phone?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}
