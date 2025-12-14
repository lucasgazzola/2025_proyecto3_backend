import { Inject, Injectable } from '@nestjs/common';
import { AREAS_REPOSITORY } from './repositories/areas.repository.interface';
import type { IAreasRepository } from './repositories/areas.repository.interface';

type SubareaDto = { _id: string; name: string };
type AreaDto = { _id: string; name: string; subareas: SubareaDto[] };

@Injectable()
export class AreasService {
	constructor(
		@Inject(AREAS_REPOSITORY)
		private readonly repository: IAreasRepository,
	) {}

	async findAll(): Promise<AreaDto[]> {
		return this.repository.findAll();
	}
}

