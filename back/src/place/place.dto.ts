import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

@ApiSchema({ name: 'Lat Lng' })
export class LatLngDto {
  @ApiProperty()
  @IsNumber()
  @IsLatitude()
  @Min(-90)
  @Max(90)
  lat: number;
  @ApiProperty()
  @IsNumber()
  @IsLongitude()
  @Min(-180)
  @Max(180)
  lng: number;
}

@ApiSchema({ name: 'Create Place Request' })
export class CreatePlaceRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
  @ApiProperty({ type: LatLngDto })
  @ValidateNested()
  @Type(() => LatLngDto)
  location: LatLngDto;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;
  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  image: string;
}

@ApiSchema({ name: 'Place Enrichment Photo' })
export class PlaceEnrichmentPhotoDto {
  @ApiProperty()
  url: string;
  @ApiProperty({ required: false })
  attribution?: string;
}

@ApiSchema({ name: 'Place Enrichment Review' })
export class PlaceEnrichmentReviewDto {
  @ApiProperty()
  author: string;
  @ApiProperty()
  rating: number;
  @ApiProperty()
  text: string;
  @ApiProperty()
  time: number;
}

@ApiSchema({ name: 'Social Links' })
export class SocialLinksDto {
  @ApiProperty({ required: false })
  instagram?: string;
  @ApiProperty({ required: false })
  facebook?: string;
  @ApiProperty({ required: false })
  twitter?: string;
  @ApiProperty({ required: false })
  tiktok?: string;
}

@ApiSchema({ name: 'Amenities' })
export class AmenitiesDto {
  @ApiProperty({ required: false, enum: ['yes', 'no', 'limited'] })
  wheelchair?: 'yes' | 'no' | 'limited';
  @ApiProperty({ required: false })
  outdoorSeating?: boolean;
  @ApiProperty({ required: false, enum: ['yes', 'no', 'wlan'] })
  wifi?: 'yes' | 'no' | 'wlan';
  @ApiProperty({ required: false, enum: ['yes', 'no', 'only'] })
  dietVegetarian?: 'yes' | 'no' | 'only';
  @ApiProperty({ required: false, enum: ['yes', 'no', 'only'] })
  dietVegan?: 'yes' | 'no' | 'only';
  @ApiProperty({ required: false, enum: ['yes', 'no', 'only'] })
  dietGlutenFree?: 'yes' | 'no' | 'only';
}

@ApiSchema({ name: 'Place Enrichment' })
export class PlaceEnrichmentDto {
  @ApiProperty()
  externalId: string;
  @ApiProperty()
  providerName: string;
  @ApiProperty({ type: [PlaceEnrichmentPhotoDto], required: false })
  photos?: PlaceEnrichmentPhotoDto[];
  @ApiProperty({ required: false })
  website?: string;
  @ApiProperty({ required: false })
  phoneNumber?: string;
  @ApiProperty({
    required: false,
    type: () => Object,
  })
  openingHours?: { weekdayText: string[] };
  @ApiProperty({ required: false })
  externalRating?: number;
  @ApiProperty({ required: false })
  externalRatingCount?: number;
  @ApiProperty({ type: [PlaceEnrichmentReviewDto], required: false })
  reviews?: PlaceEnrichmentReviewDto[];
  @ApiProperty({ required: false })
  priceLevel?: number;
  @ApiProperty({ type: [String], required: false })
  types?: string[];
  @ApiProperty({ required: false })
  googleMapsUri?: string;
  @ApiProperty({ type: SocialLinksDto, required: false })
  socialLinks?: SocialLinksDto;
  @ApiProperty({ type: AmenitiesDto, required: false })
  amenities?: AmenitiesDto;
  @ApiProperty({ type: [String], required: false })
  reservationLinks?: string[];
  @ApiProperty()
  fetchedAt: Date;
}

@ApiSchema({ name: 'Place Closed Request' })
export class PlaceClosedDto {
  @ApiProperty()
  @IsBoolean()
  closed: boolean;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ApiSchema({ name: 'Place Moderation' })
export class PlaceModerationDto {
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status: 'pending' | 'approved' | 'rejected';
  @ApiProperty({ required: false })
  rejectionReason?: string;
}

@ApiSchema({ name: 'Reject Place Request' })
export class RejectPlaceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ApiSchema({ name: 'Bulk Enrich Request' })
export class BulkEnrichDto {
  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  onlyMissing?: boolean = true;

  @ApiProperty({ required: false, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;

  @ApiProperty({ required: false, default: 250 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  delayMs?: number = 250;
}

@ApiSchema({ name: 'Bulk Enrich Error' })
export class BulkEnrichErrorDto {
  @ApiProperty()
  placeId: string;

  @ApiProperty()
  message: string;
}

@ApiSchema({ name: 'Bulk Enrich Summary' })
export class BulkEnrichSummaryDto {
  @ApiProperty()
  scanned: number;

  @ApiProperty()
  enriched: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [BulkEnrichErrorDto] })
  errors: BulkEnrichErrorDto[];
}

@ApiSchema({ name: 'Place' })
export class PlaceDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ type: LatLngDto })
  location: LatLngDto;
  @ApiProperty()
  address: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  image: string;
  @ApiProperty({ required: false })
  externalId?: string;
  @ApiProperty({ required: false })
  externalProvider?: string;
  @ApiProperty({ type: PlaceEnrichmentDto, required: false })
  enrichment?: PlaceEnrichmentDto;
  @ApiProperty({ required: false })
  enrichedAt?: Date;
  @ApiProperty({
    required: false,
    description: 'User id of the place creator (when known).',
  })
  createdBy?: string;
  @ApiProperty({
    required: false,
    description:
      'Human-readable one-liner derived from enrichment, e.g. "$$ • 4.6 ★ (1.2k)".',
  })
  summary?: string;
  @ApiProperty({
    required: false,
    enum: ['pending', 'approved', 'rejected'],
    description:
      'Only exposed to creator/admins. Other users always see "approved" since pending places are filtered out of listings.',
  })
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  @ApiProperty({ required: false })
  rejectionReason?: string;
  @ApiProperty({
    required: false,
    description: 'True when the place is permanently closed.',
  })
  permanentlyClosed?: boolean;
  @ApiProperty({ required: false })
  permanentlyClosedAt?: string;
  @ApiProperty({
    required: false,
    description:
      'Number of users who have saved this place. Only present on detail endpoints.',
  })
  saveCount?: number;
}
