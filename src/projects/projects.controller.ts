import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { validateSync, ValidationError } from 'class-validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '../auth/auth-roles.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import { Role } from '../common/enums/roles.enums';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { flattenValidationErrors } from '../common/helpers';

interface AuthRequest {
  user: {
    id: string;
  };
}

@ApiTags('projects')
@ApiBearerAuth('jwt')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.USER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  async create(@Body() body: CreateProjectDto, @Request() req: AuthRequest) {
    // body YA ES CreateProjectDto
    const dto: CreateProjectDto = body;

    const errors: ValidationError[] = validateSync(dto, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const messages = flattenValidationErrors(errors);
      throw new BadRequestException({ message: messages });
    }

    return this.projectsService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.USER, Role.AUDITOR, Role.CUSTOMER)
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.USER, Role.AUDITOR, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Update a project' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: unknown,
    @Request() req: AuthRequest,
  ) {
    if (typeof body !== 'object' || body === null) {
      throw new BadRequestException({ message: 'Invalid payload format' });
    }
    const dto: UpdateProjectDto = {
      ...(body as Record<string, unknown>),
    } as UpdateProjectDto;
    const errors = validateSync(dto as object, {
      skipMissingProperties: true,
    });
    if (errors.length > 0) {
      const messages = flattenValidationErrors(errors);
      throw new BadRequestException({ message: messages });
    }
    const { user } = req;
    const userId: string = user.id;
    return this.projectsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Soft delete a project by id' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    const { user } = req;
    const userId: string = user.id;
    return this.projectsService.remove(id, userId);
  }
}
