import { Body, Controller, Get, Post } from "@nestjs/common";
import { TagService } from "./tag.service";
import { Private } from "src/auth/auth.decorator";
import { CreateTagRequestDto, TagDto } from "./tag.dto";
import { User } from "src/user/user.decorator";

@Controller('tag')
export class TagController {
    constructor(
        private readonly tagService: TagService
    ) {}

    @Private()
    @Post()
    async createTag(@Body() tagDto: CreateTagRequestDto, @User("id") userId: string): Promise<void> {
        return await this.tagService.create(userId, tagDto);
    }

    @Private()
    @Get()
    async getTags(@User("id") userId: string): Promise<TagDto[]> {
        return await this.tagService.findAll(userId);
    }
}