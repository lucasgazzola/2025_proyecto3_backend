export const AREAS_REPOSITORY = 'AREAS_REPOSITORY';

export interface IAreasRepository {
  findAll(): Promise<{
    id: string;
    name: string;
    subareas: { id: string; name: string }[];
  }[]>;
}
