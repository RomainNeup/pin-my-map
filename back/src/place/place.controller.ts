import { Body, Controller, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Private } from "src/auth/auth.decorator";
import { PlaceService } from "./place.service";
import { CreatePlaceRequestDto, PlaceDto } from "./place.dto";

@Controller('place')
@ApiTags('Place')
export class PlaceController {
    constructor(
        private readonly placeService: PlaceService
    ) { }

    @Private()
    @Post()
    @HttpCode(201)
    @ApiResponse({ status: 201, description: 'Place successfully created.' })
    @ApiResponse({ status: 400, description: 'Failed to create place.' })
    async createPlace(@Body() placeDto: CreatePlaceRequestDto): Promise<void> {
        await this.placeService.create(placeDto);
        return;
    }

    @Private()
    @Get()
    @HttpCode(200)
    @ApiResponse({ status: 200, type: [PlaceDto], description: 'Returns all available places.' })
    async getPlaces(): Promise<PlaceDto[]> {
        return await this.placeService.findAll();
    }

    @Private()
    @Get(':id')
    @HttpCode(200)
    @ApiResponse({ status: 200, type: PlaceDto, description: 'Returns a specific place by ID.' })
    @ApiResponse({ status: 404, description: 'Place with the specified ID not found.' })
    async getPlace(@Param('id') id: string): Promise<PlaceDto> {
        return await this.placeService.findOne(id);
    }

    @Private()
    @Put(':id')
    @HttpCode(200)
    @ApiResponse({ status: 200, type: PlaceDto, description: 'Place successfully updated.' })
    @ApiResponse({ status: 404, description: 'Place with the specified ID not found.' })
    async updatePlace(@Param('id') id: string, @Body() placeDto: CreatePlaceRequestDto): Promise<PlaceDto> {
        return await this.placeService.update(id, placeDto);
    }

}