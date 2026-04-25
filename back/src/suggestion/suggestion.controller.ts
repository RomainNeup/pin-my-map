import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin, Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import {
  CreateSuggestionRequestDto,
  RejectSuggestionDto,
  SuggestionDto,
} from './suggestion.dto';
import { SuggestionStatus } from './suggestion.entity';
import { SuggestionService } from './suggestion.service';

@Controller('suggestion')
@ApiTags('Suggestion')
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @Private()
  @Post()
  @HttpCode(201)
  @ApiResponse({ status: 201, type: SuggestionDto })
  async create(
    @User('id') userId: string,
    @Body() body: CreateSuggestionRequestDto,
  ): Promise<SuggestionDto> {
    return this.suggestionService.create(userId, body);
  }

  @Admin()
  @Get()
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [SuggestionDto] })
  async list(
    @Query('status') status?: SuggestionStatus,
  ): Promise<SuggestionDto[]> {
    return this.suggestionService.list(status);
  }

  @Private()
  @Get('mine')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [SuggestionDto] })
  async listMine(@User('id') userId: string): Promise<SuggestionDto[]> {
    return this.suggestionService.listMine(userId);
  }

  @Private()
  @Get('place/:placeId/count')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Suggestion counts for a place.',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number' },
        total: { type: 'number' },
      },
    },
  })
  async countForPlace(
    @Param('placeId') placeId: string,
  ): Promise<{ pending: number; total: number }> {
    return this.suggestionService.countForPlace(placeId);
  }

  @Admin()
  @Get(':id')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: SuggestionDto })
  async get(@Param('id') id: string): Promise<SuggestionDto> {
    return this.suggestionService.findOne(id);
  }

  @Admin()
  @Post(':id/approve')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: SuggestionDto })
  async approve(
    @Param('id') id: string,
    @User('id') adminId: string,
  ): Promise<SuggestionDto> {
    return this.suggestionService.approve(id, adminId);
  }

  @Admin()
  @Post(':id/reject')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: SuggestionDto })
  async reject(
    @Param('id') id: string,
    @User('id') adminId: string,
    @Body() body: RejectSuggestionDto,
  ): Promise<SuggestionDto> {
    return this.suggestionService.reject(id, adminId, body?.reason);
  }
}
