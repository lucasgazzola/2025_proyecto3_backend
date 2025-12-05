import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('claims')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new claim' })
  @ApiBody({ type: CreateClaimDto })
  @ApiResponse({ status: 201, description: 'Claim created' })
  create(@Body() createClaimDto: CreateClaimDto) {
    return this.claimsService.create(createClaimDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all claims' })
  @ApiResponse({ status: 200, description: 'Array of claims' })
  findAll() {
    return this.claimsService.findAll();
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
  update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
    return this.claimsService.update(id, updateClaimDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a claim by id' })
  @ApiResponse({ status: 200, description: 'Deletion acknowledgment' })
  remove(@Param('id') id: string) {
    return this.claimsService.remove(id);
  }
}
