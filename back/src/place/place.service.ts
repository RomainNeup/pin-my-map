import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Place, PlaceDocument } from './place.entity';
import { Model, Types } from 'mongoose';
import { CreatePlaceRequestDto, PlaceDto } from './place.dto';
import { PlaceMapper } from './place.mapper';
import { EnrichmentService } from 'src/enrichment/enrichment.service';
import { GamificationService } from 'src/gamification/gamification.service';

@Injectable()
export class PlaceService {
  private readonly logger = new Logger(PlaceService.name);

  constructor(
    @InjectModel(Place.name) private placeModel: Model<Place>,
    private enrichmentService: EnrichmentService,
    private gamificationService: GamificationService,
  ) {}

  async create(
    createPlaceDto: CreatePlaceRequestDto,
    userId?: string,
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

    const place = new this.placeModel({
      name: createPlaceDto.name,
      location: [createPlaceDto.location.lng, createPlaceDto.location.lat],
      address: createPlaceDto.address,
      description: createPlaceDto.description,
      image: createPlaceDto.image,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
    });
    const result = await place.save();

    if (!result) {
      throw new BadRequestException('Failed to create place');
    }

    if (userId) {
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
  ): Promise<PlaceDto> {
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

    return PlaceMapper.toDto(result);
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<PlaceDto[]> {
    const limit = clampLimit(options.limit);
    const offset = options.offset && options.offset > 0 ? options.offset : 0;
    const result = await this.placeModel
      .find()
      .skip(offset)
      .limit(limit)
      .exec();
    return PlaceMapper.toDtoList(result);
  }

  async findOne(id: string): Promise<PlaceDto> {
    const result = await this.placeModel.findById(id).exec();

    if (!result) {
      throw new NotFoundException('Place not found');
    }

    return PlaceMapper.toDto(result);
  }

  async findPhotoUrl(id: string, idx: number): Promise<string> {
    const place = await this.placeModel.findById(id).exec();
    if (!place) throw new NotFoundException('Place not found');
    const photo = place.enrichment?.photos?.[idx];
    if (!photo) throw new NotFoundException('Photo not found');
    return resolvePhotoFetchUrl(photo.url);
  }

  async search(query: string): Promise<PlaceDto[]> {
    const safe = (query ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const result = await this.placeModel
      .find({ name: { $regex: safe, $options: 'i' } })
      .exec();
    return PlaceMapper.toDtoList(result);
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

function resolvePhotoFetchUrl(persistedUrl: string): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return persistedUrl;
  return persistedUrl.includes('?')
    ? `${persistedUrl}&key=${apiKey}`
    : `${persistedUrl}?key=${apiKey}`;
}
