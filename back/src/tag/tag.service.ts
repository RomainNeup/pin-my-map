import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Tag } from "./tag.entity";
import { Model } from "mongoose";
import { CreateTagRequestDto, TagDto } from "./tag.dto";
import { TagMapper } from "./tag.mapper";

@Injectable()
export class TagService {
    constructor(
        @InjectModel(Tag.name) private tagModel: Model<Tag>
    ) {}

    async create(userId: string, tag: CreateTagRequestDto): Promise<void> {
        const newTag = new this.tagModel({
            name: tag.name,
            emoji: tag.emoji,
            owner: userId
        });
        const result = await newTag.save();
        return;
    }

    async findAll(userId: string): Promise<TagDto[]> {
        const result = await this.tagModel.find({ owner: userId }).exec();
        return TagMapper.toDtoList(result);
    }

    async findByIds(userId: string, ids: string[]): Promise<TagDto[]> {
        const result = await this.tagModel.find({ _id: { $in: ids }, owner: userId }).exec();
        return TagMapper.toDtoList(result);
    }

    async findOne(userId: string, id: string): Promise<TagDto> {
        const result = await this.tagModel.findOne({ _id: id, owner: userId }).exec();

        if (!result) {
            throw new NotFoundException('Tag not found');
        }

        return TagMapper.toDto(result);
    }
}