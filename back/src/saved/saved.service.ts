import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { SavedPlace } from "./saved.entity";
import { Model } from "mongoose";
import { SavedPlaceDto } from "./saved.dto";
import { SavedPlaceMapper } from "./saved.mapper";
import { PlaceService } from "src/place/place.service";

@Injectable()
export class SavedPlaceService {
    constructor(
        @InjectModel(SavedPlace.name) private savedPlaceModel: Model<SavedPlace>,
        private placeService: PlaceService
    ) { }

    async create(userId: string, placeId: string): Promise<void> {
        const exists = await this.placeService.findOne(placeId);

        if (!exists) {
            throw new NotFoundException('Place not found');
        }

        const alreadySaved = await this.savedPlaceModel.exists({ user: userId, place: placeId }).exec();

        if (alreadySaved) {
            throw new BadRequestException('Place already saved');
        }

        await this.savedPlaceModel.create({ user: userId, place: placeId });

        return;
    }

    async delete(userId: string, savedPlaceId: string): Promise<void> {
        const exists = await this.savedPlaceModel.exists({ user: userId, _id: savedPlaceId }).exec();

        if (!exists) {
            throw new NotFoundException('Saved place not found');
        }

        await this.savedPlaceModel.deleteOne({ user: userId, _id: savedPlaceId }).exec();

        return;
    }

    async findOne(userId: string, savedPlaceId: string): Promise<SavedPlaceDto> {
        const savedPlace = await this.savedPlaceModel
            .findOne({ user: userId, _id: savedPlaceId })
            .populate(['place', 'tags'])
            .exec();

        if (!savedPlace) {
            throw new NotFoundException('Saved place not found');
        }

        return SavedPlaceMapper.toDto(savedPlace);
    }

    async findAll(userId: string): Promise<SavedPlaceDto[]> {
        const savedPlaces = await this.savedPlaceModel
            .find({ user: userId })
            .populate(['place', 'tags'])
            .exec();
        if (!savedPlaces) {
            return [];
        }

        return SavedPlaceMapper.toDtoList(savedPlaces);
    }

    async addTag(userId: string, savedPlaceId: string, tagId: string): Promise<void> {
        const place = await this.findOne(userId, savedPlaceId);

        if (!place) {
            throw new NotFoundException('Saved place not found');
        }

        await this.savedPlaceModel.updateOne({ _id: savedPlaceId }, { $push: { tags: tagId } });

        return;
    }

    async removeTag(userId: string, savedPlaceId: string, tagId: string): Promise<void> {
        const place = await this.findOne(userId, savedPlaceId);

        if (!place) {
            throw new NotFoundException('Saved place not found');
        }

        await this.savedPlaceModel.updateOne({ _id: savedPlaceId }, { $pull: { tags: tagId } });

        return;
    }

    async addComment(userId: string, savedPlaceId: string, comment: string): Promise<void> {
        const place = await this.findOne(userId, savedPlaceId);

        if (!place) {
            throw new NotFoundException('Saved place not found');
        }

        await this.savedPlaceModel.updateOne({ _id: savedPlaceId }, { comment });

        return;
    }

    async addRating(userId: string, savedPlaceId: string, rating: number): Promise<void> {
        const place = await this.findOne(userId, savedPlaceId);

        if (!place) {
            throw new NotFoundException('Saved place not found');
        }

        await this.savedPlaceModel.updateOne({ _id: savedPlaceId }, { rating });

        return;
    }

    async toogleDone(userId: string, savedPlaceId: string): Promise<void> {
        const place = await this.findOne(userId, savedPlaceId);

        if (!place) {
            throw new NotFoundException('Saved place not found');
        }

        await this.savedPlaceModel.updateOne({ _id: savedPlaceId }, { done: !place.done });

        return;
    }
}