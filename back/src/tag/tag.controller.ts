import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { Private } from 'src/auth/auth.decorator';
import { CreateTagRequestDto, TagDto, UpdateTagRequestDto } from './tag.dto';
import { User } from 'src/user/user.decorator';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('tag')
@ApiTags('Tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Private()
  @Post()
  @HttpCode(201)
  @ApiResponse({
    status: 201,
    type: TagDto,
    description: 'The tag has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data.' })
  @ApiResponse({
    status: 409,
    description: 'A tag with this name already exists for this user.',
  })
  async createTag(
    @Body() tagDto: CreateTagRequestDto,
    @User('id') userId: string,
  ): Promise<TagDto> {
    return await this.tagService.create(userId, tagDto);
  }

  @Private()
  @Get()
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: [TagDto],
    description: 'Returns all tags for the authenticated user.',
  })
  async getTags(@User('id') userId: string): Promise<TagDto[]> {
    return await this.tagService.findAll(userId);
  }

  @Private()
  @Put(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: TagDto,
    description: 'The tag has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  @ApiResponse({
    status: 409,
    description: 'A tag with this name already exists for this user.',
  })
  async updateTag(
    @Param('id') id: string,
    @Body() tagDto: UpdateTagRequestDto,
    @User('id') userId: string,
  ): Promise<TagDto> {
    return await this.tagService.update(userId, id, tagDto);
  }

  @Private()
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({
    status: 204,
    description: 'The tag has been deleted and removed from all saved places.',
  })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async deleteTag(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<void> {
    await this.tagService.delete(userId, id);
  }
}
