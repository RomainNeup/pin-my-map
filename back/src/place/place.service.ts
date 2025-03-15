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

    async create(createPlaceDto: CreatePlaceRequestDto): Promise<void> {
        if ((!createPlaceDto.location) || (createPlaceDto.location.lat < -90 || createPlaceDto.location.lat > 90) || (createPlaceDto.location.lng < -180 || createPlaceDto.location.lng > 180)) {
            throw new BadRequestException('Invalid latitude');
        }
        if (!createPlaceDto.name) {
            throw new BadRequestException('Name is required');
        }
        if (!createPlaceDto.address) {
            throw new BadRequestException('Address is required');
        }
        if (!createPlaceDto.description || createPlaceDto.description.length < 10) {
            throw new BadRequestException('Description is required and must be at least 10 characters long');
        }

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

        return;
    }

    async update(id: string, updatePlaceDto: CreatePlaceRequestDto): Promise<PlaceDto> {
        const place = await this.findOne(id);

        if (!place) {
            throw new NotFoundException('Place not found');
        }

        if (updatePlaceDto.location) {
            if ((updatePlaceDto.location.lat < -90 || updatePlaceDto.location.lat > 90) || (updatePlaceDto.location.lng < -180 || updatePlaceDto.location.lng > 180)) {
                throw new BadRequestException('Invalid latitude');
            }

            place.location = {
                lng: updatePlaceDto.location.lng,
                lat: updatePlaceDto.location.lat
            };
        }
        if (updatePlaceDto.name) {
            place.name = updatePlaceDto.name;
        }
        if (updatePlaceDto.address) {
            place.address = updatePlaceDto.address;
        }
        if (updatePlaceDto.description) {
            place.description = updatePlaceDto.description;
        }
        if (updatePlaceDto.image) {
            place.image = updatePlaceDto.image;
        }

        const result = await this.placeModel.updateOne({ _id: id }, place).exec();

        if (!result) {
            throw new BadRequestException('Failed to update place');
        }

        return this.findOne(id);
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

    async findByName(name: string): Promise<PlaceDto> {
        const result = await this.placeModel.findOne({ name }).exec();

        if (!result) {
            throw new NotFoundException('Place not found');
        }

        return PlaceMapper.toDto(result);
    }
}