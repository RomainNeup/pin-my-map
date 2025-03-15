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
    @ApiResponse({ status: 200, type: [SavedPlaceDto], description: 'Return all saved places' })
    async getSavedPlaces(@User("id") userId: string): Promise<SavedPlaceDto[]> {
        return await this.savedPlaceService.findAll(userId);
    }

    @Private()
    @Post(':id')
    @HttpCode(201)
    @ApiResponse({ status: 201, description: 'Place saved' })
    @ApiResponse({ status: 400, description: 'Place already saved' })
    @ApiResponse({ status: 404, description: 'Place not found' })
    async savePlace(@User("id") userId: string, @Param('id') id: string): Promise<void> {
        return await this.savedPlaceService.create(userId, id);
    }

    @Private()
    @Delete(':id')
    @HttpCode(204)
    @ApiResponse({ status: 204, description: 'Place unsaved' })
    @ApiResponse({ status: 404, description: 'Saved place not found' })
    async unsavePlace(@User("id") userId: string, @Param('id') id: string): Promise<void> {
        return await this.savedPlaceService.delete(userId, id);
    }

    @Private()
    @Get(':id')
    @ApiResponse({ status: 200, type: SavedPlaceDto, description: 'Return saved place by id' })
    @ApiResponse({ status: 404, description: 'Saved place not found' })
    async getPlace(@User("id") userId: string, @Param('id') id: string): Promise<SavedPlaceDto> {
        return await this.savedPlaceService.findOne(userId, id);
    }

    @Private()
    @Put(':id/tag/:tagId')
    @HttpCode(201)
    @ApiResponse({ status: 201, description: 'Tag linked' })
    @ApiResponse({ status: 400, description: 'Tag already linked' })
    @ApiResponse({ status: 404, description: 'Saved place or tag not found' })
    async addTag(@User("id") userId: string, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
        return await this.savedPlaceService.addTag(userId, id, tagId);
    }

    @Private()
    @Delete(':id/tag/:tagId')
    @HttpCode(204)
    @ApiResponse({ status: 204, description: 'Tag unlinked' })
    @ApiResponse({ status: 400, description: 'Tag not linked' })
    @ApiResponse({ status: 404, description: 'Saved place not found' })
    async removeTag(@User("id") userId: string, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
        return await this.savedPlaceService.removeTag(userId, id, tagId);
    }

    @Private()
    @Put(':id/comment')
    @HttpCode(200)
    @ApiResponse({ status: 200, type: SavedPlaceDto, description: 'Comment added' })
    @ApiResponse({ status: 400, description: 'Comment must be provided' })
    @ApiResponse({ status: 404, description: 'Saved place not found' })
    async addComment(@User("id") userId: string, @Param('id') id: string, @Body() body: CommentSavedPlaceDto): Promise<SavedPlaceDto> {
        return await this.savedPlaceService.addComment(userId, id, body.comment);
    }

    @Private()
    @Put(':id/rating')
    @HttpCode(200)
    @ApiResponse({ status: 200, type: SavedPlaceDto, description: 'Rating added' })
    @ApiResponse({ status: 400, description: 'Rating must be between 0 and 5' })
    @ApiResponse({ status: 404, description: 'Saved place not found' })
    async addRating(@User("id") userId: string, @Param('id') id: string, @Body() body: RatingSavedPlaceDto): Promise<SavedPlaceDto> {
        return await this.savedPlaceService.addRating(userId, id, body.rating);
    }

    @Private()
    @Patch(':id/done')
    @HttpCode(204)
    @ApiResponse({ status: 204, description: 'Done toogled' })
    @ApiResponse({ status: 404, description: 'Saved place not found' })
    async toogleDone(@User("id") userId: string, @Param('id') id: string): Promise<void> {
        return await this.savedPlaceService.toogleDone(userId, id);
    }
}