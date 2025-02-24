import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Private } from "src/auth/auth.decorator";
import { SavedPlaceService } from "./saved.service";
import { CommentSavedPlaceDto, RatingSavedPlaceDto, SavedPlaceDto } from "./saved.dto";
import { User } from "src/user/user.decorator";

@Controller('saved')
@ApiTags('Saved place')
export class SavedController {
    constructor(
        private readonly savedPlaceService: SavedPlaceService
    ) { }

    @Private()
    @Get()
    @HttpCode(200)
    @ApiResponse({ status: 200, type: [SavedPlaceDto] })
    async getSavedPlaces(@User("id") userId: string): Promise<SavedPlaceDto[]> {
        return await this.savedPlaceService.findAll(userId);
    }

    @Private()
    @Post(':id')
    @HttpCode(201)
    async savePlace(@User("id") userId: string, @Param('id') id: string): Promise<void> {
        return await this.savedPlaceService.create(userId, id);
    }

    @Private()
    @Delete(':id')
    @HttpCode(204)
    async unsavePlace(@User("id") userId: string, @Param('id') id: string): Promise<void> {
        return await this.savedPlaceService.delete(userId, id);
    }

    @Private()
    @Get(':id')
    @ApiResponse({ status: 200, type: SavedPlaceDto })
    async getPlace(@User("id") userId: string, @Param('id') id: string): Promise<SavedPlaceDto> {
        return await this.savedPlaceService.findOne(userId, id);
    }

    @Private()
    @Put(':id/tag/:tagId')
    async addTag(@User("id") userId: string, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
        return await this.savedPlaceService.addTag(userId, id, tagId);
    }

    @Private()
    @Delete(':id/tag/:tagId')
    async removeTag(@User("id") userId: string, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
        return await this.savedPlaceService.removeTag(userId, id, tagId);
    }

    @Private()
    @Put(':id/comment')
    async addComment(@User("id") userId: string, @Param('id') id: string, @Body() body: CommentSavedPlaceDto): Promise<void> {
        return await this.savedPlaceService.addComment(userId, id, body.comment);
    }

    @Private()
    @Put(':id/rating')
    async addRating(@User("id") userId: string, @Param('id') id: string, @Body() body: RatingSavedPlaceDto): Promise<void> {
        return await this.savedPlaceService.addRating(userId, id, body.rating);
    }

    @Private()
    @Patch(':id/done')
    @HttpCode(204)
    async toogleDone(@User("id") userId: string, @Param('id') id: string): Promise<void> {
        return await this.savedPlaceService.toogleDone(userId, id);
    }
}