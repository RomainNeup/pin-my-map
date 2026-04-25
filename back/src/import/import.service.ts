import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parse } from 'csv-parse/sync';
import { AuditService } from 'src/audit/audit.service';
import { GamificationService } from 'src/gamification/gamification.service';
import { Place } from 'src/place/place.entity';
import { SavedPlace } from 'src/saved/saved.entity';
import { Tag } from 'src/tag/tag.entity';
import {
  CsvImportErrorDto,
  CsvImportSummaryDto,
  GoogleImportSummaryDto,
  ImportErrorDto,
  ImportSummaryDto,
} from './import.dto';

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

// ── TAS-13: Google Takeout shapes ─────────────────────────────────────────────

interface GoogleFeatureProperties {
  Title?: string;
  name?: string;
  'Google Maps URL'?: string;
  address?: string;
  note?: string;
}

interface GoogleGeoJsonFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number] };
  properties: GoogleFeatureProperties;
}

interface GoogleGeoJson {
  type: 'FeatureCollection';
  features: GoogleGeoJsonFeature[];
}

interface GoogleLegacyItem {
  title?: string;
  location?: { latitude?: number; longitude?: number; address?: string };
  note?: string;
}

interface NormalizedGoogleEntry {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  note?: string;
}

// ── CSV expected header columns (case-insensitive) ────────────────────────────

const CSV_REQUIRED_COLUMNS = ['name', 'lat', 'lng', 'address'] as const;
const CSV_OPTIONAL_COLUMNS = ['description', 'image'] as const;
const CSV_ALL_COLUMNS = [...CSV_REQUIRED_COLUMNS, ...CSV_OPTIONAL_COLUMNS];

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectModel(Place.name) private readonly placeModel: Model<Place>,
    @InjectModel(Tag.name) private readonly tagModel: Model<Tag>,
    @InjectModel(SavedPlace.name)
    private readonly savedPlaceModel: Model<SavedPlace>,
    private readonly gamificationService: GamificationService,
    private readonly auditService: AuditService,
  ) {}

  // ── Mapstr ─────────────────────────────────────────────────────────────────

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

    try {
      await this.gamificationService.recompute(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gamification recompute failed: ${message}`);
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

  // ── TAS-11: Admin bulk CSV import ─────────────────────────────────────────

  async importPlacesCsv(
    adminId: string,
    csvBuffer: Buffer,
  ): Promise<CsvImportSummaryDto> {
    let rows: Record<string, string>[];

    try {
      rows = parse(csvBuffer, {
        columns: (header: string[]) =>
          header.map((h) => h.trim().toLowerCase()),
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
      }) as Record<string, string>[];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`CSV parse error: ${message}`);
    }

    if (rows.length === 0) {
      throw new BadRequestException('CSV file has no data rows');
    }

    // Validate required header columns exist
    const firstRowKeys = Object.keys(rows[0]);
    const missingRequired = CSV_REQUIRED_COLUMNS.filter(
      (col) => !firstRowKeys.includes(col),
    );
    if (missingRequired.length > 0) {
      throw new BadRequestException(
        `CSV missing required columns: ${missingRequired.join(', ')}`,
      );
    }

    const summary: CsvImportSummaryDto = { created: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1; // 1-based, header excluded by csv-parse
      const row = rows[i];

      // Skip truly empty rows (all known column values are empty)
      if (CSV_ALL_COLUMNS.every((col) => !row[col])) {
        continue;
      }

      const error = await this.processCsvRow(adminId, row, rowNum);
      if (error) {
        summary.errors.push(error);
      } else {
        summary.created++;
      }
    }

    try {
      await this.auditService.log({
        actor: adminId,
        action: 'place.bulk_import',
        targetType: 'place',
        meta: { created: summary.created, errors: summary.errors.length },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Audit log failed: ${message}`);
    }

    return summary;
  }

  private async processCsvRow(
    adminId: string,
    row: Record<string, string>,
    rowNum: number,
  ): Promise<CsvImportErrorDto | null> {
    const name = (row['name'] ?? '').trim();
    if (!name) {
      return { row: rowNum, message: 'Missing required field: name' };
    }

    const latRaw = (row['lat'] ?? '').trim();
    const lngRaw = (row['lng'] ?? '').trim();
    const address = (row['address'] ?? '').trim();

    if (!latRaw) {
      return { row: rowNum, message: 'Missing required field: lat' };
    }
    if (!lngRaw) {
      return { row: rowNum, message: 'Missing required field: lng' };
    }
    if (!address) {
      return { row: rowNum, message: 'Missing required field: address' };
    }

    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);

    if (!isFinite(lat) || lat < -90 || lat > 90) {
      return { row: rowNum, message: `Invalid lat value: ${latRaw}` };
    }
    if (!isFinite(lng) || lng < -180 || lng > 180) {
      return { row: rowNum, message: `Invalid lng value: ${lngRaw}` };
    }

    const description = (row['description'] ?? '').trim();
    const image = (row['image'] ?? '').trim();

    try {
      await this.placeModel.create({
        name,
        location: [lng, lat],
        address,
        description: description || '',
        image: image || undefined,
        moderationStatus: 'approved',
        createdBy: adminId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { row: rowNum, message: `DB error: ${message}` };
    }

    return null;
  }

  // ── TAS-13: Google Takeout import ─────────────────────────────────────────

  async importGoogle(
    userId: string,
    parsedJson: unknown,
  ): Promise<GoogleImportSummaryDto> {
    const entries = this.normalizeGoogleInput(parsedJson);

    const summary: GoogleImportSummaryDto = {
      placesCreated: 0,
      savedCreated: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        await this.processGoogleEntry(userId, entry, summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        summary.errors.push({ index: i, name: entry.name, message });
        this.logger.warn(
          `Google entry ${i} (${entry.name}) failed: ${message}`,
        );
      }
    }

    try {
      await this.auditService.log({
        actor: userId,
        action: 'import.google',
        targetType: 'import',
        meta: {
          placesCreated: summary.placesCreated,
          savedCreated: summary.savedCreated,
          skipped: summary.skipped,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Audit log failed: ${message}`);
    }

    return summary;
  }

  private normalizeGoogleInput(parsedJson: unknown): NormalizedGoogleEntry[] {
    if (!parsedJson || typeof parsedJson !== 'object') {
      throw new BadRequestException('Uploaded file is not a valid JSON object');
    }

    // GeoJSON FeatureCollection (newer Takeout)
    const asObj = parsedJson as Record<string, unknown>;
    if (
      asObj['type'] === 'FeatureCollection' &&
      Array.isArray(asObj['features'])
    ) {
      const doc = parsedJson as GoogleGeoJson;
      return doc.features
        .map((f, idx) => {
          try {
            return this.normalizeGeoJsonFeature(f);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Skipping GeoJSON feature ${idx}: ${message}`);
            return null;
          }
        })
        .filter((e): e is NormalizedGoogleEntry => e !== null);
    }

    // JSON array (legacy Takeout)
    if (Array.isArray(parsedJson)) {
      return (parsedJson as GoogleLegacyItem[])
        .map((item, idx) => {
          try {
            return this.normalizeLegacyItem(item);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Skipping legacy item ${idx}: ${message}`);
            return null;
          }
        })
        .filter((e): e is NormalizedGoogleEntry => e !== null);
    }

    throw new BadRequestException(
      'Unrecognized Google Takeout format: expected a GeoJSON FeatureCollection or a JSON array',
    );
  }

  private normalizeGeoJsonFeature(
    feature: GoogleGeoJsonFeature,
  ): NormalizedGoogleEntry {
    if (
      !feature.geometry ||
      feature.geometry.type !== 'Point' ||
      !Array.isArray(feature.geometry.coordinates)
    ) {
      throw new Error('Missing or non-Point geometry');
    }
    const [lng, lat] = feature.geometry.coordinates;
    if (!isFinite(lat) || !isFinite(lng)) {
      throw new Error('Invalid coordinates');
    }
    const props = feature.properties ?? {};
    const name = ((props.Title ?? props.name) || '').trim();
    if (!name) throw new Error('Missing name');
    return { name, lat, lng, address: props.address, note: props.note };
  }

  private normalizeLegacyItem(item: GoogleLegacyItem): NormalizedGoogleEntry {
    const name = (item.title ?? '').trim();
    if (!name) throw new Error('Missing title');
    const loc = item.location;
    if (!loc) throw new Error('Missing location');
    const lat = loc.latitude;
    const lng = loc.longitude;
    if (
      lat === undefined ||
      lng === undefined ||
      !isFinite(lat) ||
      !isFinite(lng)
    ) {
      throw new Error('Invalid coordinates');
    }
    return { name, lat, lng, address: loc.address, note: item.note };
  }

  private async processGoogleEntry(
    userId: string,
    entry: NormalizedGoogleEntry,
    summary: GoogleImportSummaryDto,
  ): Promise<void> {
    // Try exact coords first, then a ~25m bounding-box tolerance
    let place = await this.placeModel
      .findOne({ name: entry.name, location: [entry.lng, entry.lat] })
      .exec();

    if (!place) {
      const tolerance = 0.0003; // ~33 m
      place = await this.placeModel
        .findOne({
          name: entry.name,
          'location.0': {
            $gte: entry.lng - tolerance,
            $lte: entry.lng + tolerance,
          },
          'location.1': {
            $gte: entry.lat - tolerance,
            $lte: entry.lat + tolerance,
          },
        })
        .exec();
    }

    let isNewPlace = false;
    if (!place) {
      place = await this.placeModel.create({
        name: entry.name,
        location: [entry.lng, entry.lat],
        address: entry.address,
        moderationStatus: 'pending',
        createdBy: userId,
      });
      isNewPlace = true;
      summary.placesCreated++;

      try {
        await this.gamificationService.award(userId, 'place_create');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Gamification award (place_create) failed: ${message}`,
        );
      }
    }

    const alreadySaved = await this.savedPlaceModel
      .exists({ user: userId, place: place._id })
      .exec();

    if (alreadySaved) {
      if (!isNewPlace) {
        summary.skipped++;
      }
      return;
    }

    await this.savedPlaceModel.create({
      user: userId,
      place: place._id,
      comment: entry.note || undefined,
    });
    summary.savedCreated++;

    try {
      await this.gamificationService.award(userId, 'save');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gamification award (save) failed: ${message}`);
    }
  }
}
