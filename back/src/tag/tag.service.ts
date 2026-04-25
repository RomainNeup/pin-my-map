import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Tag } from './tag.entity';
import { Model } from 'mongoose';
import { CreateTagRequestDto, TagDto, UpdateTagRequestDto } from './tag.dto';
import { TagMapper } from './tag.mapper';
import { SavedPlace } from 'src/saved/saved.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<Tag>,
    @InjectModel(SavedPlace.name) private savedPlaceModel: Model<SavedPlace>,
  ) {}

  async create(userId: string, tag: CreateTagRequestDto): Promise<TagDto> {
    const duplicate = await this.tagModel
      .findOne({ owner: userId, name: tag.name })
      .exec();
    if (duplicate) {
      throw new ConflictException('A tag with this name already exists');
    }

    const newTag = new this.tagModel({
      name: tag.name,
      emoji: tag.emoji,
      color: tag.color,
      owner: userId,
    });
    const result = await newTag.save();
    return TagMapper.toDto(result);
  }

  async findAll(userId: string): Promise<TagDto[]> {
    const result = await this.tagModel.find({ owner: userId }).exec();
    return TagMapper.toDtoList(result);
  }

  async findByIds(userId: string, ids: string[]): Promise<TagDto[]> {
    const result = await this.tagModel
      .find({ _id: { $in: ids }, owner: userId })
      .exec();
    return TagMapper.toDtoList(result);
  }

  async findOne(userId: string, id: string): Promise<TagDto> {
    const result = await this.tagModel
      .findOne({ _id: id, owner: userId })
      .exec();

    if (!result) {
      throw new NotFoundException('Tag not found');
    }

    return TagMapper.toDto(result);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTagRequestDto,
  ): Promise<TagDto> {
    const duplicate = await this.tagModel
      .findOne({ owner: userId, name: dto.name, _id: { $ne: id } })
      .exec();
    if (duplicate) {
      throw new ConflictException('A tag with this name already exists');
    }

    const result = await this.tagModel
      .findOneAndUpdate(
        { _id: id, owner: userId },
        { name: dto.name, emoji: dto.emoji, color: dto.color },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Tag not found');
    }

    return TagMapper.toDto(result);
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.tagModel
      .findOneAndDelete({ _id: id, owner: userId })
      .exec();

    if (!result) {
      throw new NotFoundException('Tag not found');
    }

    await this.savedPlaceModel
      .updateMany({ user: userId, tags: id }, { $pull: { tags: id } })
      .exec();
  }
}
