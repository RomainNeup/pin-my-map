import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PlaceDto } from 'src/place/place.dto';
import { TagDto } from 'src/tag/tag.dto';

@ApiSchema({ name: 'Saved Place' })
export class SavedPlaceDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  place: PlaceDto;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  tags: TagDto[];
  @ApiProperty()
  done: boolean;
  @ApiProperty()
  comment: string;
  @ApiProperty()
  rating?: number;
}

@ApiSchema({ name: 'Comment Saved Place' })
export class CommentSavedPlaceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment: string;
}

@ApiSchema({ name: 'Rating Saved Place' })
export class RatingSavedPlaceDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;
}

@ApiSchema({ name: 'Place is Saved' })
export class PlaceIsSavedDto {
  @ApiProperty()
  id?: string;
  @ApiProperty()
  isSaved: boolean;
}
