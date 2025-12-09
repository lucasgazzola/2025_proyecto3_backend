import { Controller, Get, Param } from '@nestjs/common';
import { SubareasService } from './subareas.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('subareas')
@Controller('subareas')
export class SubareasController {
  constructor(private readonly subareasService: SubareasService) {}

  @Get(':id')
  @ApiOperation({ summary: 'List subareas of an area' })
  @ApiResponse({ status: 200, description: 'Subareas returned successfully' })
  findByArea(@Param('id') id: string) {
    return this.subareasService.findByArea(id);
  }
}
