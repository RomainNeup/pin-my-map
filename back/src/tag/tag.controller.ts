import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { TagService } from "./tag.service";
import { Private } from "src/auth/auth.decorator";
import { CreateTagRequestDto, TagDto } from "./tag.dto";
import { User } from "src/user/user.decorator";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller('tag')
@ApiTags('Tags')
export class TagController {
    constructor(
        private readonly tagService: TagService
    ) { }

    @Private()
    @Post()
    @HttpCode(201)
    @ApiResponse({ status: 201, description: 'The tag has been successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad request. Invalid input data.' })
    async createTag(@Body() tagDto: CreateTagRequestDto, @User("id") userId: string): Promise<void> {
        return await this.tagService.create(userId, tagDto);
    }

    @Private()
    @Get()
    @HttpCode(200)
    @ApiResponse({ status: 200, type: [TagDto], description: 'Returns all tags for the authenticated user.' })
    async getTags(@User("id") userId: string): Promise<TagDto[]> {
        return await this.tagService.findAll(userId);
    }
}