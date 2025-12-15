import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { Roles } from '../auth/roles.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../common/enums/roles.enums';
import { CurrentUser } from 'src/auth/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR, Role.CUSTOMER)
  @ApiOperation({ summary: 'Reportes y métricas filtrables por rol' })
  @ApiResponse({ status: 200, description: 'Métricas agregadas según el rol' })
  async getReports(
    @CurrentUser() user: { id: string; role: Role },
    @Query() filters: DashboardFiltersDto,
  ) {
    if (user.role === Role.ADMIN || user.role === Role.AUDITOR) {
      return this.dashboardService.getReportsForAdmin(filters);
    }
    if (user.role === Role.CUSTOMER) {
      return this.dashboardService.getReportsForCustomer(user.id, filters);
    }
    throw new ForbiddenException('Rol no soportado para reportes');
  }

}
