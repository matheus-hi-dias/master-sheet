import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { TemplateAccessGuard } from '../auth/guards/template-access.guard';
import { GetCurrentUser } from '../auth/decorators/get-user.decorator';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new template (skeleton)' })
  create(
    @GetCurrentUser('userId') userId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.create(userId, createTemplateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List templates with pagination, search and filters',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Comma separated tags (e.g. D&D,Fantasy)',
  })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Text search on name and description',
  })
  @ApiQuery({
    name: 'system',
    required: false,
    description: 'System identifier (e.g. dnd5e, vampire_v5)',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['public', 'mine'],
    description: 'Filter by ownership scope; default is own + public',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
  })
  findAll(
    @GetCurrentUser('userId') userId: string,
    @Query('tags') tags?: string,
    @Query('isPublic') isPublic?: string,
    @Query('search') search?: string,
    @Query('system') system?: string,
    @Query('scope') scope?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.templatesService.findAll(
      tags,
      isPublic,
      userId,
      search,
      system,
      scope,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get(':id')
  @UseGuards(TemplateAccessGuard)
  @ApiOperation({ summary: 'Get a template by ID (must be public or owner)' })
  findOne(
    @Param('id') id: string,
    @Req() request: Request & { template?: unknown },
  ) {
    // Use the record pre-fetched by TemplateAccessGuard when available.
    return request.template ?? this.templatesService.findOne(id);
  }

  @Post(':id/fork')
  @UseGuards(TemplateAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Fork a public template (or own) into a private clone',
  })
  fork(@GetCurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.templatesService.fork(userId, id);
  }

  @Patch(':id')
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Update a template (owner only)' })
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template (owner only)' })
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
