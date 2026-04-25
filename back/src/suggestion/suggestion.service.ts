import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditService } from 'src/audit/audit.service';
import { GamificationService } from 'src/gamification/gamification.service';
import { Place } from 'src/place/place.entity';
import { PlaceService } from 'src/place/place.service';
import { CreateSuggestionRequestDto, SuggestionDto } from './suggestion.dto';
import { PlaceSuggestion, SuggestionStatus } from './suggestion.entity';
import { SuggestionMapper } from './suggestion.mapper';

@Injectable()
export class SuggestionService {
  constructor(
    @InjectModel(PlaceSuggestion.name)
    private suggestionModel: Model<PlaceSuggestion>,
    @InjectModel(Place.name)
    private placeModel: Model<Place>,
    private placeService: PlaceService,
    private auditService: AuditService,
    private gamificationService: GamificationService,
  ) {}

  async create(
    userId: string,
    dto: CreateSuggestionRequestDto,
  ): Promise<SuggestionDto> {
    if (!dto.placeId || !Types.ObjectId.isValid(dto.placeId)) {
      throw new BadRequestException('placeId is required');
    }

    const current = await this.placeService.findOne(dto.placeId);
    if (!current) {
      throw new NotFoundException('Place not found');
    }

    const changes: PlaceSuggestion['changes'] = {};
    const c = dto.changes ?? {};

    if (c.name !== undefined && c.name !== current.name) {
      changes.name = c.name;
    }
    if (c.description !== undefined && c.description !== current.description) {
      changes.description = c.description;
    }
    if (c.address !== undefined && c.address !== current.address) {
      changes.address = c.address;
    }
    if (c.image !== undefined && c.image !== current.image) {
      changes.image = c.image;
    }
    if (c.location) {
      const { lat, lng } = c.location;
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        throw new BadRequestException('Invalid location');
      }
      if (lat !== current.location.lat || lng !== current.location.lng) {
        changes.location = [lng, lat];
      }
    }

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No changes to suggest');
    }

    const created = await this.suggestionModel.create({
      user: new Types.ObjectId(userId),
      place: new Types.ObjectId(dto.placeId),
      changes,
      note: dto.note?.trim() || undefined,
      status: 'pending',
    });

    await this.auditService.log({
      actor: userId,
      action: 'suggestion.create',
      targetType: 'suggestion',
      targetId: (created._id as Types.ObjectId).toHexString(),
      after: { placeId: dto.placeId, changes, note: dto.note },
    });

    const populated = await this.suggestionModel
      .findById(created._id)
      .populate(['user', 'place'])
      .exec();
    return SuggestionMapper.toDto(populated!);
  }

  async list(status?: SuggestionStatus): Promise<SuggestionDto[]> {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const results = await this.suggestionModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate(['user', 'place'])
      .exec();
    return SuggestionMapper.toDtoList(results);
  }

  async listMine(userId: string): Promise<SuggestionDto[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }
    const results = await this.suggestionModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate(['user', 'place']);
    return SuggestionMapper.toDtoList(results);
  }

  async countForPlace(
    placeId: string,
  ): Promise<{ pending: number; total: number }> {
    if (!Types.ObjectId.isValid(placeId)) {
      throw new BadRequestException('Invalid placeId');
    }
    const placeObjectId = new Types.ObjectId(placeId);
    const [pending, total] = await Promise.all([
      this.suggestionModel.countDocuments({
        place: placeObjectId,
        status: 'pending',
      }),
      this.suggestionModel.countDocuments({ place: placeObjectId }),
    ]);
    return { pending, total };
  }

  async findOne(id: string): Promise<SuggestionDto> {
    const result = await this.suggestionModel
      .findById(id)
      .populate(['user', 'place'])
      .exec();
    if (!result) {
      throw new NotFoundException('Suggestion not found');
    }
    return SuggestionMapper.toDto(result);
  }

  async approve(id: string, adminId: string): Promise<SuggestionDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    const entity = await this.suggestionModel.findById(id).exec();
    if (!entity) {
      throw new NotFoundException('Suggestion not found');
    }
    if (entity.status !== 'pending') {
      throw new BadRequestException(`Suggestion already ${entity.status}`);
    }

    const placeId = entity.place.toString();
    const before = await this.placeService.findOne(placeId);

    const update: Record<string, unknown> = {};
    if (entity.changes.name !== undefined) update.name = entity.changes.name;
    if (entity.changes.description !== undefined)
      update.description = entity.changes.description;
    if (entity.changes.address !== undefined)
      update.address = entity.changes.address;
    if (entity.changes.image !== undefined) update.image = entity.changes.image;
    if (Array.isArray(entity.changes.location)) {
      update.location = entity.changes.location;
    }

    await this.placeModel.updateOne({ _id: placeId }, { $set: update }).exec();
    const after = await this.placeService.findOne(placeId);

    entity.status = 'approved';
    entity.reviewedBy = new Types.ObjectId(adminId);
    entity.reviewedAt = new Date();
    await entity.save();

    try {
      await this.gamificationService.award(
        entity.user.toString(),
        'suggestion',
      );
    } catch {
      // never let gamification break the primary action
    }

    await this.auditService.log({
      actor: adminId,
      action: 'suggestion.approve',
      targetType: 'suggestion',
      targetId: id,
      meta: { placeId },
    });
    await this.auditService.log({
      actor: adminId,
      action: 'place.update',
      targetType: 'place',
      targetId: placeId,
      before: diffSnapshot(before, entity.changes),
      after: diffSnapshot(after, entity.changes),
      meta: { suggestionId: id },
    });

    return this.findOne(id);
  }

  async reject(
    id: string,
    adminId: string,
    reason?: string,
  ): Promise<SuggestionDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    const entity = await this.suggestionModel.findById(id).exec();
    if (!entity) {
      throw new NotFoundException('Suggestion not found');
    }
    if (entity.status !== 'pending') {
      throw new BadRequestException(`Suggestion already ${entity.status}`);
    }

    entity.status = 'rejected';
    entity.reviewedBy = new Types.ObjectId(adminId);
    entity.reviewedAt = new Date();
    entity.reviewReason = reason?.trim() || undefined;
    await entity.save();

    await this.auditService.log({
      actor: adminId,
      action: 'suggestion.reject',
      targetType: 'suggestion',
      targetId: id,
      meta: { reason: entity.reviewReason, placeId: entity.place.toString() },
    });

    return this.findOne(id);
  }
}

function diffSnapshot(
  place: {
    name: string;
    description: string;
    address: string;
    image: string;
    location: { lat: number; lng: number };
  },
  changes: {
    name?: string;
    description?: string;
    address?: string;
    image?: string;
    location?: number[];
  },
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  if (changes.name !== undefined) snapshot.name = place.name;
  if (changes.description !== undefined)
    snapshot.description = place.description;
  if (changes.address !== undefined) snapshot.address = place.address;
  if (changes.image !== undefined) snapshot.image = place.image;
  if (changes.location !== undefined) snapshot.location = place.location;
  return snapshot;
}
