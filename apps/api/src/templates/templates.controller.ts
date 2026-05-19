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
} from '@nestjs/common';
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
  @ApiOperation({ summary: 'Create a new template (skeleton)' })
  create(
    @GetCurrentUser('userId') userId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.create(userId, createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'List templates (own or public)' })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Comma separated tags (e.g. D&D,Fantasy)',
  })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  findAll(
    @GetCurrentUser('userId') userId: string,
    @Query('tags') tags?: string,
    @Query('isPublic') isPublic?: string,
  ) {
    const isPublicBool =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    return this.templatesService.findAll(tags, isPublicBool, userId);
  }

  @Get(':id')
  @UseGuards(TemplateAccessGuard)
  @ApiOperation({ summary: 'Get a template by ID (must be public or owner)' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
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
