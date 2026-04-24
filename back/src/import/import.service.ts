import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Place } from 'src/place/place.entity';
import { SavedPlace } from 'src/saved/saved.entity';
import { Tag } from 'src/tag/tag.entity';
import { ImportErrorDto, ImportSummaryDto } from './import.dto';

const LEADING_EMOJI_REGEX =
  /^(\p{Regional_Indicator}\p{Regional_Indicator}|\p{Extended_Pictographic}(?:\u{FE0F})?)\s*/u;

export function extractLeadingEmoji(raw: string): {
  name: string;
  emoji: string;
} {
  const trimmed = (raw ?? '').trim();
  const match = trimmed.match(LEADING_EMOJI_REGEX);

  if (!match) {
    return { name: trimmed, emoji: '📍' };
  }

  return {
    name: trimmed.slice(match[0].length).trim() || trimmed,
    emoji: match[1],
  };
}

interface MapstrFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    name: string;
    address?: string;
    icon?: string;
    userComment?: string;
    tags?: Array<{ name: string; color?: string }>;
  };
}

interface MapstrGeoJson {
  type: string;
  features: MapstrFeature[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectModel(Place.name) private readonly placeModel: Model<Place>,
    @InjectModel(Tag.name) private readonly tagModel: Model<Tag>,
    @InjectModel(SavedPlace.name)
    private readonly savedPlaceModel: Model<SavedPlace>,
  ) {}

  async importMapstr(
    userId: string,
    geojson: unknown,
  ): Promise<ImportSummaryDto> {
    if (!geojson || typeof geojson !== 'object') {
      throw new BadRequestException('Invalid Mapstr file: not an object');
    }

    const doc = geojson as MapstrGeoJson;

    if (doc.type !== 'FeatureCollection' || !Array.isArray(doc.features)) {
      throw new BadRequestException(
        'Invalid Mapstr file: expected a GeoJSON FeatureCollection',
      );
    }

    const existingTags = await this.tagModel.find({ owner: userId }).exec();
    const tagByName = new Map<
      string,
      { id: string; name: string; emoji: string }
    >();
    for (const tag of existingTags) {
      tagByName.set(tag.name.toLowerCase(), {
        id: tag._id.toString(),
        name: tag.name,
        emoji: tag.emoji,
      });
    }

    const summary: ImportSummaryDto = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < doc.features.length; i++) {
      const feature = doc.features[i];
      try {
        await this.importFeature(userId, feature, tagByName, summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const error: ImportErrorDto = {
          index: i,
          name: feature?.properties?.name,
          message,
        };
        summary.errors.push(error);
        summary.failed++;
        this.logger.warn(
          `Feature ${i} (${error.name ?? 'unknown'}) failed: ${message}`,
        );
      }
    }

    return summary;
  }

  private async importFeature(
    userId: string,
    feature: MapstrFeature,
    tagByName: Map<string, { id: string; name: string; emoji: string }>,
    summary: ImportSummaryDto,
  ): Promise<void> {
    if (!feature || feature.type !== 'Feature') {
      throw new Error('Not a GeoJSON Feature');
    }
    if (
      !feature.geometry ||
      feature.geometry.type !== 'Point' ||
      !Array.isArray(feature.geometry.coordinates)
    ) {
      throw new Error('Missing or non-Point geometry');
    }

    const [lng, lat] = feature.geometry.coordinates;
    if (
      typeof lng !== 'number' ||
      typeof lat !== 'number' ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new Error('Invalid coordinates');
    }

    const props = feature.properties ?? ({} as MapstrFeature['properties']);
    const name = (props.name ?? '').trim();
    if (!name) {
      throw new Error('Missing name');
    }

    let place = await this.placeModel
      .findOne({ name, location: [lng, lat] })
      .exec();
    if (!place) {
      place = await this.placeModel.create({
        name,
        location: [lng, lat],
        address: props.address,
      });
    }

    const alreadySaved = await this.savedPlaceModel
      .exists({ user: userId, place: place._id })
      .exec();
    if (alreadySaved) {
      summary.skipped++;
      return;
    }

    const tagIds: string[] = [];
    for (const rawTag of props.tags ?? []) {
      if (!rawTag?.name) continue;
      const { name: tagName, emoji } = extractLeadingEmoji(rawTag.name);
      const key = tagName.toLowerCase();
      let cached = tagByName.get(key);
      if (!cached) {
        const created = await this.tagModel.create({
          owner: userId,
          name: tagName,
          emoji,
        });
        cached = { id: created._id.toString(), name: tagName, emoji };
        tagByName.set(key, cached);
      }
      tagIds.push(cached.id);
    }

    const comment = (props.userComment ?? '').trim();
    await this.savedPlaceModel.create({
      user: userId,
      place: place._id,
      tags: tagIds,
      comment: comment || undefined,
    });
    summary.imported++;
  }
}
