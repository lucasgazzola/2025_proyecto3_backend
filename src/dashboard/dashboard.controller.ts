import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dashboard' })
  @ApiBody({ type: CreateDashboardDto })
  @ApiResponse({ status: 201, description: 'Dashboard created' })
  create(@Body() createDashboardDto: CreateDashboardDto) {
    return this.dashboardService.create(createDashboardDto);
  }

  @Get()
  @ApiOperation({ summary: 'List dashboards' })
  @ApiResponse({ status: 200, description: 'Array of dashboards' })
  findAll() {
    return this.dashboardService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dashboard by id' })
  @ApiResponse({ status: 200, description: 'Dashboard object' })
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dashboard' })
  @ApiBody({ type: UpdateDashboardDto })
  @ApiResponse({ status: 200, description: 'Updated dashboard' })
  update(
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ) {
    return this.dashboardService.update(+id, updateDashboardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dashboard' })
  @ApiResponse({ status: 200, description: 'Deletion acknowledgment' })
  remove(@Param('id') id: string) {
    return this.dashboardService.remove(+id);
  }
}
