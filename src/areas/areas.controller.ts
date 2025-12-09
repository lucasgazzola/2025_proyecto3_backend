import { Controller, Get, Param } from '@nestjs/common';
import { AreasService } from './areas.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('areas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get an area by id' })
  @ApiResponse({ status: 200, description: 'Area returned successfully' })
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(id);
  }
}
