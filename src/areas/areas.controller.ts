import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { AreaResponseDto } from './dto/area-response.dto';

@ApiTags('Areas')
@Controller('areas')
export class AreasController {
	constructor(private readonly areasService: AreasService) {}

	@Get('/')
	@ApiOperation({ summary: 'Listar todas las áreas y subáreas' })
	@ApiOkResponse({
		description: 'Listado de áreas con sus subáreas',
		type: AreaResponseDto,
		isArray: true,
		schema: {
			example: [
				{
					id: '675a1c2f5b2c3d4e5f6a7b8c',
					name: 'Operaciones',
					subareas: [
						{ id: '675a1c2f5b2c3d4e5f6a7b8d', name: 'Logística' },
						{ id: '675a1c2f5b2c3d4e5f6a7b8e', name: 'Compras' },
					],
				},
				{
					id: '675a1c2f5b2c3d4e5f6a7b8f',
					name: 'Tecnología',
					subareas: [
						{ id: '675a1c2f5b2c3d4e5f6a7b90', name: 'Backend' },
						{ id: '675a1c2f5b2c3d4e5f6a7b91', name: 'Frontend' },
					],
				},
			],
		},
	})
	async getAreas(): Promise<AreaResponseDto[]> {
		return this.areasService.findAll();
	}
}

