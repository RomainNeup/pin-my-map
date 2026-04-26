import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SavedPlace } from './saved.entity';
import { Model } from 'mongoose';
import { PlaceIsSavedDto, SavedPlaceDto } from './saved.dto';
import { SavedPlaceMapper } from './saved.mapper';
import { PlaceService } from 'src/place/place.service';
import { TagService } from 'src/tag/tag.service';
import {
  GamificationAction,
  GamificationService,
} from 'src/gamification/gamification.service';

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@Injectable()
export class SavedPlaceService {
  private readonly logger = new Logger(SavedPlaceService.name);

  constructor(
    @InjectModel(SavedPlace.name) private savedPlaceModel: Model<SavedPlace>,
    private placeService: PlaceService,
    private tagService: TagService,
    private gamificationService: GamificationService,
  ) {}

  async create(userId: string, placeId: string): Promise<void> {
    await this.placeService.findOne(placeId);

    const alreadySaved = await this.exists(userId, placeId);
    if (alreadySaved.isSaved) {
      throw new BadRequestException('Place already saved');
    }

    await this.savedPlaceModel.create({ user: userId, place: placeId });

    await this.safeAward(userId, 'save');
  }

  async delete(userId: string, savedPlaceId: string): Promise<void> {
    const result = await this.savedPlaceModel
      .deleteOne({ user: userId, _id: savedPlaceId })
      .exec();

    if (!result.deletedCount) {
      throw new NotFoundException('Saved place not found');
    }
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

  async findAll(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      tagIds?: string[];
      done?: boolean;
    } = {},
  ): Promise<SavedPlaceDto[]> {
    const { limit, offset, tagIds, done } = options;

    const query: Record<string, unknown> = { user: userId };
    if (tagIds && tagIds.length > 0) {
      query.tags = { $in: tagIds };
    }
    if (done !== undefined) {
      query.done = done;
    }

    let cursor = this.savedPlaceModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate(['place', 'tags']);

    if (typeof offset === 'number' && offset > 0) {
      cursor = cursor.skip(offset);
    }
    if (typeof limit === 'number' && limit > 0) {
      cursor = cursor.limit(limit);
    }

    const savedPlaces = await cursor.exec();
    return SavedPlaceMapper.toDtoList(savedPlaces);
  }

  async exists(userId: string, id: string): Promise<PlaceIsSavedDto> {
    await this.placeService.findOne(id);

    const saved = await this.savedPlaceModel
      .exists({ user: userId, place: id })
      .exec();

    if (!saved) {
      return { isSaved: false };
    }

    return { id: saved._id.toHexString(), isSaved: true };
  }

  async addTag(
    userId: string,
    savedPlaceId: string,
    tagId: string,
  ): Promise<void> {
    await this.tagService.findOne(userId, tagId);

    const before = await this.savedPlaceModel
      .findOne({ _id: savedPlaceId, user: userId })
      .exec();
    if (!before) {
      throw new NotFoundException('Saved place not found');
    }
    if (before.tags?.some((t) => t.toString() === tagId)) {
      throw new BadRequestException('Tag already linked');
    }
    const wasEmpty = !before.tags || before.tags.length === 0;

    await this.savedPlaceModel.updateOne(
      { _id: savedPlaceId, user: userId },
      { $addToSet: { tags: tagId } },
    );

    if (wasEmpty) {
      await this.safeAward(userId, 'tag');
    }
  }

  async removeTag(
    userId: string,
    savedPlaceId: string,
    tagId: string,
  ): Promise<void> {
    const result = await this.savedPlaceModel.updateOne(
      { _id: savedPlaceId, user: userId, tags: tagId },
      { $pull: { tags: tagId } },
    );

    if (!result.matchedCount) {
      throw new BadRequestException('Tag not linked');
    }
  }

  async addComment(
    userId: string,
    savedPlaceId: string,
    comment: string,
  ): Promise<SavedPlaceDto> {
    if (!comment || !comment.trim()) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const before = await this.savedPlaceModel
      .findOneAndUpdate(
        { _id: savedPlaceId, user: userId },
        { $set: { comment } },
        { new: false },
      )
      .exec();
    if (!before) {
      throw new NotFoundException('Saved place not found');
    }

    const wasEmpty = !before.comment || !before.comment.trim();
    if (wasEmpty) {
      await this.safeAward(userId, 'comment');
    }

    return this.findOne(userId, savedPlaceId);
  }

  async addRating(
    userId: string,
    savedPlaceId: string,
    rating: number,
  ): Promise<SavedPlaceDto> {
    if (rating < 0 || rating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

    const before = await this.savedPlaceModel
      .findOneAndUpdate(
        { _id: savedPlaceId, user: userId },
        { $set: { rating } },
        { new: false },
      )
      .exec();
    if (!before) {
      throw new NotFoundException('Saved place not found');
    }

    const hadRating = typeof before.rating === 'number';
    if (!hadRating && rating >= 1) {
      await this.safeAward(userId, 'rate');
    }

    return this.findOne(userId, savedPlaceId);
  }

  async exportCsv(userId: string): Promise<string> {
    const savedPlaces = await this.savedPlaceModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .populate(['place', 'tags'])
      .exec();

    const header = 'id,name,address,lat,lng,rating,done,comment,tags,createdAt';
    const lines: string[] = [header];

    for (const sp of savedPlaces) {
      const place = sp.place;
      // GeoJSON convention in `Place.location`: [lng, lat].
      const lng = place?.location?.[0];
      const lat = place?.location?.[1];
      const tagNames = (sp.tags ?? [])
        .map((t) => (t?.name ?? '').replace(/\|/g, ' '))
        .join('|');
      const row = [
        sp._id.toHexString(),
        place?.name ?? '',
        place?.address ?? '',
        lat ?? '',
        lng ?? '',
        sp.rating ?? '',
        sp.done ? 'true' : 'false',
        sp.comment ?? '',
        tagNames,
        sp.createdAt ? sp.createdAt.toISOString() : '',
      ]
        .map((v) => csvEscape(v))
        .join(',');
      lines.push(row);
    }

    return lines.join('\r\n') + '\r\n';
  }

  async toggleDone(userId: string, savedPlaceId: string): Promise<void> {
    const current = await this.savedPlaceModel
      .findOne({ _id: savedPlaceId, user: userId })
      .exec();
    if (!current) {
      throw new NotFoundException('Saved place not found');
    }

    const newDone = !current.done;
    await this.savedPlaceModel.updateOne(
      { _id: savedPlaceId, user: userId },
      { $set: { done: newDone } },
    );

    if (newDone) {
      await this.safeAward(userId, 'done');
    }
  }

  private async safeAward(
    userId: string,
    action: GamificationAction,
  ): Promise<void> {
    try {
      await this.gamificationService.award(userId, action);
    } catch (err) {
      this.logger.warn(`gamification award failed: ${(err as Error).message}`);
    }
  }
}
