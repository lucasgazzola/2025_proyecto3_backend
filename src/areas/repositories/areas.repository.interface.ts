export const AREAS_REPOSITORY = 'AREAS_REPOSITORY';

export interface IAreasRepository {
  findAll(): Promise<{
    _id: string;
    name: string;
    subareas: { _id: string; name: string }[];
  }[]>;
}
