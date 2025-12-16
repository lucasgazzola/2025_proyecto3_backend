import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UseGuards, Body as BodyDec } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from 'src/common/enums/roles.enums';
import { type Payload } from 'src/common/interfaces/payload';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('claims')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new claim (with up to 2 images)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', example: 'System crashes when saving' },
        project: { type: 'string', example: '64a1f2...' },
        priority: { type: 'string', enum: ['LOW','MEDIUM','HIGH','URGENT'], example: 'MEDIUM' },
        criticality: { type: 'string', enum: ['MINOR','MAJOR','CRITICAL','BLOCKER'], example: 'MAJOR' },
        claimType: { type: 'string', enum: ['TECHNICAL','BILLING','CUSTOMER_SERVICE','OTHER'], example: 'TECHNICAL' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Hasta 2 imágenes (png, jpg, jpeg). También admite pdf.'
        },
      },
      required: ['description','project','priority','criticality','claimType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Claim created' })
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext);
          cb(null, `${base}-${unique}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /(\.(png|jpg|jpeg|pdf))$/i;
        if (allowed.test(file.originalname)) return cb(null, true);
        cb(new Error('Only images (png,jpg,jpeg) or PDF are allowed'), false);
      },
    }),
  )
  create(@CurrentUser() user: Payload, @Body() createClaimDto: CreateClaimDto, @UploadedFiles() files: any[] = []) {
    if (user.role !== Role.CUSTOMER) {
      throw new UnauthorizedException('Only users with CUSTOMER role can create claims');
    }
    return this.claimsService.create(createClaimDto, user.id, files);
  }

  @Get()
  @ApiOperation({ summary: 'List all claims' })
  @ApiResponse({ status: 200, description: 'Array of claims' })
  findAll(@CurrentUser() user: Payload) {
    return this.claimsService.findAllForUser(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a claim by id' })
  @ApiResponse({ status: 200, description: 'Claim object' })
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a claim' })
  @ApiBody({ type: UpdateClaimDto })
  @ApiResponse({ status: 200, description: 'Updated claim object' })
  update(@CurrentUser() user: Payload, @Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
    if (user.role !== Role.USER) {
      throw new UnauthorizedException('Only users with USER role can update claims');
    }

    return this.claimsService.updateWithHistory(id, updateClaimDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  @ApiOperation({ summary: 'Get claim history by claim id' })
  @ApiResponse({ status: 200, description: 'Claim history entries' })
  getHistory(@Param('id') id: string) {
    return this.claimsService.getHistory(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/message')
  @ApiOperation({ summary: 'Post message on a claim' })
  @ApiResponse({ status: 201, description: 'Message created' })
  postMessage(@Param('id') id: string, @CurrentUser() user: Payload, @BodyDec() body: { content: string; state: 'PRIVADO' | 'PUBLICO' }) {
    return this.claimsService.postMessage(id, user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a claim' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  getMessages(@Param('id') id: string) {
    return this.claimsService.getMessages(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a claim by id' })
  @ApiResponse({ status: 200, description: 'Deletion acknowledgment' })
  remove(@Param('id') id: string) {
    return this.claimsService.remove(id);
  }

}
