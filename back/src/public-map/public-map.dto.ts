import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { PlaceDto } from 'src/place/place.dto';
import { TagDto } from 'src/tag/tag.dto';

@ApiSchema({ name: 'Public Saved Place' })
export class PublicSavedPlaceDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  place: PlaceDto;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];
  @ApiProperty()
  done: boolean;
  @ApiProperty()
  comment: string;
  @ApiProperty({ required: false })
  rating?: number;
}

@ApiSchema({ name: 'Public Map Owner' })
export class PublicMapOwnerDto {
  @ApiProperty({ required: false })
  userId?: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ required: false })
  publicSlug?: string;
}

@ApiSchema({ name: 'Public Map' })
export class PublicMapDto {
  @ApiProperty()
  owner: PublicMapOwnerDto;
  @ApiProperty({ type: [PublicSavedPlaceDto] })
  savedPlaces: PublicSavedPlaceDto[];
}

@ApiSchema({ name: 'Public Map Summary' })
export class PublicMapSummaryDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  publicSlug: string;
  @ApiProperty()
  savedCount: number;
  @ApiProperty()
  followerCount: number;
}
