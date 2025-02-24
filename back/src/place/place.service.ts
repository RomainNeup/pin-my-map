import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Place, } from "./place.entity";
import { Model } from "mongoose";
import { CreatePlaceRequestDto, PlaceDto } from "./place.dto";
import { PlaceMapper } from "./place.mapper";

@Injectable()
export class PlaceService {
    constructor(
        @InjectModel(Place.name) private placeModel: Model<Place>
    ) { }

    async create(createPlaceDto: CreatePlaceRequestDto): Promise<Place> {
        const place = new this.placeModel({
            name: createPlaceDto.name,
            location: [createPlaceDto.location.lng, createPlaceDto.location.lat],
            address: createPlaceDto.address,
            description: createPlaceDto.description,
            image: createPlaceDto.image
        });
        const result = await place.save();

        if (!result) {
            throw new BadRequestException('Failed to create place');
        }

        return result;
    }

    async findAll(): Promise<PlaceDto[]> {
        const result = await this.placeModel.find().exec();
        return PlaceMapper.toDtoList(result);
    }

    async findOne(id: string): Promise<PlaceDto> {
        const result = await this.placeModel.findById(id).exec();

        if (!result) {
            throw new NotFoundException('Place not found');
        }

        return PlaceMapper.toDto(result);
    }

    async findByName(name: string): Promise<Place | null> {
        return await this.placeModel.findOne({ name }).exec();
    }
}