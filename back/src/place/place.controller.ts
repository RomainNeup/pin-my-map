import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Private } from "src/auth/auth.decorator";
import { PlaceService } from "./place.service";
import { CreatePlaceRequestDto, PlaceDto } from "./place.dto";

@Controller('place')
@ApiTags('Place')
export class PlaceController {
    constructor(
        private readonly placeService: PlaceService
    ) {}

    @Private()
    @Post()
    @HttpCode(201)
    async createPlace(@Body() placeDto: CreatePlaceRequestDto): Promise<void> {
        await this.placeService.create(placeDto);
        return;
    }
    
    @Private()
    @Get()
    @HttpCode(200)
    async getPlaces(): Promise<PlaceDto[]> {
        return await this.placeService.findAll();
    }
    
    @Private()
    @Get(':id')
    async getPlace(@Param('id') id: string): Promise<PlaceDto> {
        return await this.placeService.findOne(id);
    }
}