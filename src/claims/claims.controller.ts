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
import { UseGuards, Body as BodyDec } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('claims')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new claim' })
  @ApiBody({ type: CreateClaimDto })
  @ApiResponse({ status: 201, description: 'Claim created' })
  create(@CurrentUser() user: any, @Body() createClaimDto: CreateClaimDto) {
    console.log({user})
    return this.claimsService.create(createClaimDto, user.id || user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List all claims' })
  @ApiResponse({ status: 200, description: 'Array of claims' })
  findAll(@CurrentUser() user: any) {
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
  update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
    return this.claimsService.updateWithHistory(id, updateClaimDto);
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
  postMessage(@Param('id') id: string, @CurrentUser() user: any, @BodyDec() body: { content: string; state: 'PRIVADO' | 'PUBLICO' }) {
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
