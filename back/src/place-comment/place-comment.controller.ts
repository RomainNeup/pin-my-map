import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import { CreateCommentDto, PlaceCommentDto } from './place-comment.dto';
import { PlaceCommentService } from './place-comment.service';

@Controller('comments')
@ApiTags('Comments')
export class PlaceCommentController {
  constructor(private readonly commentService: PlaceCommentService) {}

  @Get('saved/:savedPlaceId')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [PlaceCommentDto] })
  async list(
    @Param('savedPlaceId') savedPlaceId: string,
  ): Promise<PlaceCommentDto[]> {
    return this.commentService.listForSavedPlace(savedPlaceId);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Private()
  @Post('saved/:savedPlaceId')
  @HttpCode(201)
  @ApiResponse({ status: 201, type: PlaceCommentDto })
  async create(
    @User('id') me: string,
    @Param('savedPlaceId') savedPlaceId: string,
    @Body() body: CreateCommentDto,
  ): Promise<PlaceCommentDto> {
    return this.commentService.create(me, savedPlaceId, body);
  }

  @Private()
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204 })
  async remove(@User('id') me: string, @Param('id') id: string): Promise<void> {
    await this.commentService.remove(me, id);
  }
}
