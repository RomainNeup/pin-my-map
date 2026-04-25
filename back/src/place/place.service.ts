import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Place, PlaceDocument } from './place.entity';
import { Model, Types } from 'mongoose';
import { CreatePlaceRequestDto, PlaceDto } from './place.dto';
import { PlaceMapper } from './place.mapper';
import { EnrichmentService } from 'src/enrichment/enrichment.service';
import { GamificationService } from 'src/gamification/gamification.service';
import { AuditService } from 'src/audit/audit.service';

export interface PlaceActor {
  id: string;
  role?: 'user' | 'admin';
}

@Injectable()
export class PlaceService implements OnModuleInit {
  private readonly logger = new Logger(PlaceService.name);

  constructor(
    @InjectModel(Place.name) private placeModel: Model<Place>,
    private enrichmentService: EnrichmentService,
    private gamificationService: GamificationService,
    private auditService: AuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.backfillModerationStatus();
    } catch (err) {
      this.logger.warn(
        `moderationStatus backfill failed: ${(err as Error).message}`,
      );
    }
  }

  async backfillModerationStatus(): Promise<number> {
    const count = await this.placeModel
      .countDocuments({ moderationStatus: { $exists: false } })
      .exec();
    if (count === 0) return 0;
    const result = await this.placeModel
      .updateMany(
        { moderationStatus: { $exists: false } },
        { $set: { moderationStatus: 'approved' } },
      )
      .exec();
    const modified = (result as { modifiedCount?: number }).modifiedCount ?? 0;
    if (modified > 0) {
      this.logger.log(
        `Backfilled moderationStatus='approved' on ${modified} legacy place(s)`,
      );
    }
    return modified;
  }

  async create(
    createPlaceDto: CreatePlaceRequestDto,
    userId?: string,
    actorRole?: 'user' | 'admin',
  ): Promise<PlaceDto> {
    assertValidLocation(createPlaceDto.location);
    if (!createPlaceDto.name) {
      throw new BadRequestException('Name is required');
    }
    if (!createPlaceDto.address) {
      throw new BadRequestException('Address is required');
    }
    if (!createPlaceDto.description || createPlaceDto.description.length < 10) {
      throw new BadRequestException(
        'Description is required and must be at least 10 characters long',
      );
    }

    const isAdmin = actorRole === 'admin';
    const moderationStatus: 'pending' | 'approved' = isAdmin
      ? 'approved'
      : 'pending';

    const place = new this.placeModel({
      name: createPlaceDto.name,
      location: [createPlaceDto.location.lng, createPlaceDto.location.lat],
      address: createPlaceDto.address,
      description: createPlaceDto.description,
      image: createPlaceDto.image,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      moderationStatus,
    });
    const result = await place.save();

    if (!result) {
      throw new BadRequestException('Failed to create place');
    }

    // Award place_create only when status becomes 'approved' (admin self-create
    // here; for users, the award fires from approve()).
    if (userId && moderationStatus === 'approved') {
      try {
        await this.gamificationService.award(userId, 'place_create');
      } catch (err) {
        this.logger.warn(
          `gamification award failed: ${(err as Error).message}`,
        );
      }
    }

    // Fire-and-forget: enrichment must never block place creation.
    void this.runEnrichment(result).catch((err) => {
      this.logger.warn(
        `Enrichment failed for place ${result._id.toHexString()}: ${(err as Error).message}`,
      );
    });

    return PlaceMapper.toDto(result);
  }

  async update(
    id: string,
    updatePlaceDto: CreatePlaceRequestDto,
    actor: { id: string; role?: string },
  ): Promise<PlaceDto> {
    const existing = await loadExisting(this.placeModel, id);
    if (!existing) {
      throw new NotFoundException('Place not found');
    }

    const isAdmin = actor.role === 'admin';
    const isCreator =
      !!existing.createdBy &&
      existing.createdBy.equals(new Types.ObjectId(actor.id));
    if (!isAdmin && !isCreator) {
      throw new ForbiddenException(
        'Only the creator or an admin can edit this place',
      );
    }

    const before = snapshotPlace(existing);

    const update: Record<string, unknown> = {};
    if (updatePlaceDto.location) {
      assertValidLocation(updatePlaceDto.location);
      update.location = [
        updatePlaceDto.location.lng,
        updatePlaceDto.location.lat,
      ];
    }
    if (updatePlaceDto.name !== undefined) update.name = updatePlaceDto.name;
    if (updatePlaceDto.address !== undefined)
      update.address = updatePlaceDto.address;
    if (updatePlaceDto.description !== undefined)
      update.description = updatePlaceDto.description;
    if (updatePlaceDto.image !== undefined) update.image = updatePlaceDto.image;

    const result = await this.placeModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();

    if (!result) {
      throw new NotFoundException('Place not found');
    }

    const after = snapshotPlace(result);

    try {
      await this.auditService.log({
        actor: actor.id,
        action: 'place.update',
        targetType: 'Place',
        targetId: id,
        before,
        after,
      });
    } catch (err) {
      this.logger.warn(
        `audit log failed for place.update ${id}: ${(err as Error).message}`,
      );
    }

    return PlaceMapper.toDto(result);
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<PlaceDto[]> {
    const limit = clampLimit(options.limit);
    const offset = options.offset && options.offset > 0 ? options.offset : 0;
    const result = await this.placeModel
      .find({ moderationStatus: 'approved' })
      .skip(offset)
      .limit(limit)
      .exec();
    return PlaceMapper.toDtoList(result);
  }

  async findOne(id: string, actor?: PlaceActor): Promise<PlaceDto> {
    const result = await this.placeModel.findById(id).exec();

    if (!result) {
      throw new NotFoundException('Place not found');
    }

    if (result.moderationStatus && result.moderationStatus !== 'approved') {
      const isAdmin = actor?.role === 'admin';
      const isOwner =
        actor?.id !== undefined &&
        result.createdBy !== undefined &&
        result.createdBy?.toString() === actor.id;
      if (!isAdmin && !isOwner) {
        throw new NotFoundException('Place not found');
      }
    }

    return PlaceMapper.toDto(result);
  }

  async findPhotoUrl(id: string, idx: number): Promise<string | null> {
    const place = await this.placeModel.findById(id).exec();
    if (!place) throw new NotFoundException('Place not found');
    const photo = place.enrichment?.photos?.[idx];
    if (!photo) return null;
    return resolvePhotoFetchUrl(photo.url);
  }

  async search(query: string): Promise<PlaceDto[]> {
    const safe = (query ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const result = await this.placeModel
      .find({
        name: { $regex: safe, $options: 'i' },
        moderationStatus: 'approved',
      })
      .exec();
    return PlaceMapper.toDtoList(result);
  }

  async listPending(): Promise<PlaceDto[]> {
    const result = await this.placeModel
      .find({ moderationStatus: 'pending' })
      .sort({ _id: -1 })
      .exec();
    return PlaceMapper.toDtoList(result);
  }

  async approve(id: string, adminId: string): Promise<PlaceDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    const place = await this.placeModel.findById(id).exec();
    if (!place) {
      throw new NotFoundException('Place not found');
    }
    if (place.moderationStatus === 'approved') {
      throw new BadRequestException('Place already approved');
    }

    place.moderationStatus = 'approved';
    place.rejectionReason = undefined;
    await place.save();

    if (place.createdBy) {
      const creatorId = place.createdBy.toString();
      try {
        await this.gamificationService.award(creatorId, 'place_create');
      } catch (err) {
        this.logger.warn(
          `gamification award failed: ${(err as Error).message}`,
        );
      }
    }

    try {
      await this.auditService.log({
        actor: adminId,
        action: 'place.approve',
        targetType: 'place',
        targetId: id,
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }

    return PlaceMapper.toDto(place);
  }

  async reject(
    id: string,
    adminId: string,
    reason?: string,
  ): Promise<PlaceDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    const place = await this.placeModel.findById(id).exec();
    if (!place) {
      throw new NotFoundException('Place not found');
    }
    if (place.moderationStatus === 'rejected') {
      throw new BadRequestException('Place already rejected');
    }

    place.moderationStatus = 'rejected';
    place.rejectionReason = reason?.trim() || undefined;
    await place.save();

    try {
      await this.auditService.log({
        actor: adminId,
        action: 'place.reject',
        targetType: 'place',
        targetId: id,
        meta: { reason: place.rejectionReason },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }

    return PlaceMapper.toDto(place);
  }

  async findByName(name: string): Promise<PlaceDto> {
    const result = await this.placeModel.findOne({ name }).exec();

    if (!result) {
      throw new NotFoundException('Place not found');
    }

    return PlaceMapper.toDto(result);
  }

  async refreshEnrichment(id: string): Promise<PlaceDto> {
    const place = await this.placeModel.findById(id).exec();
    if (!place) {
      throw new NotFoundException('Place not found');
    }

    void this.runEnrichment(place, true).catch((err) => {
      this.logger.warn(
        `Enrichment refresh failed for place ${place._id.toHexString()}: ${(err as Error).message}`,
      );
    });

    return PlaceMapper.toDto(place);
  }

  private async runEnrichment(
    place: PlaceDocument,
    refresh = false,
  ): Promise<void> {
    let result = null;
    if (refresh && place.externalProvider && place.externalId) {
      result = await this.enrichmentService.refresh(
        place.externalProvider,
        place.externalId,
      );
    }
    if (!result) {
      result = await this.enrichmentService.enrich({
        name: place.name,
        location: [place.location[0], place.location[1]],
        address: place.address,
      });
    }
    if (result) {
      place.externalId = result.externalId;
      place.externalProvider = result.providerName;
      place.enrichment = result;
      place.enrichedAt = result.fetchedAt;
      await place.save();
    }
  }
}

function assertValidLocation(
  location: { lat: number; lng: number } | undefined,
): void {
  if (!location) {
    throw new BadRequestException('Location is required');
  }
  if (location.lat < -90 || location.lat > 90) {
    throw new BadRequestException('Invalid latitude');
  }
  if (location.lng < -180 || location.lng > 180) {
    throw new BadRequestException('Invalid longitude');
  }
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
function clampLimit(value: number | undefined): number {
  if (!value || value <= 0) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

function snapshotPlace(place: PlaceDocument): Record<string, unknown> {
  return {
    name: place.name,
    description: place.description,
    address: place.address,
    image: place.image,
    location: Array.isArray(place.location)
      ? [...place.location]
      : place.location,
  };
}

function loadExisting(
  model: Model<Place>,
  id: string,
): Promise<PlaceDocument | null> {
  return model.findById(id).exec();
}

function resolvePhotoFetchUrl(persistedUrl: string): string {
  return persistedUrl;
}
