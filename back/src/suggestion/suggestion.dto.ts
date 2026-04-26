import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LatLngDto, PlaceDto } from 'src/place/place.dto';
import { SuggestionStatus } from './suggestion.entity';

@ApiSchema({ name: 'Suggestion Changes' })
export class SuggestionChangesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  image?: string;
  @ApiProperty({ required: false, type: LatLngDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LatLngDto)
  location?: LatLngDto;
  @ApiProperty({
    required: false,
    description:
      'Propose marking this place as permanently closed (or reopened)',
  })
  @IsOptional()
  @IsBoolean()
  permanentlyClosed?: boolean;
}

@ApiSchema({ name: 'Create Suggestion Request' })
export class CreateSuggestionRequestDto {
  @ApiProperty()
  @IsMongoId()
  placeId: string;
  @ApiProperty({ type: SuggestionChangesDto })
  @ValidateNested()
  @Type(() => SuggestionChangesDto)
  changes: SuggestionChangesDto;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@ApiSchema({ name: 'Reject Suggestion Request' })
export class RejectSuggestionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ApiSchema({ name: 'Suggestion' })
export class SuggestionDto {
  @ApiProperty()
  id: string;
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status: SuggestionStatus;
  @ApiProperty()
  submitterId: string;
  @ApiProperty({ required: false })
  submitterName?: string;
  @ApiProperty({ required: false })
  submitterEmail?: string;
  @ApiProperty({ type: PlaceDto, required: false })
  place?: PlaceDto;
  @ApiProperty()
  placeId: string;
  @ApiProperty({ type: SuggestionChangesDto })
  changes: SuggestionChangesDto;
  @ApiProperty({ required: false })
  note?: string;
  @ApiProperty({ required: false })
  reviewedBy?: string;
  @ApiProperty({ required: false })
  reviewedAt?: string;
  @ApiProperty({ required: false })
  reviewReason?: string;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
}
