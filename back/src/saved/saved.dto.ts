import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { PlaceDto } from "src/place/place.dto";
import { TagDto } from "src/tag/tag.dto";

@ApiSchema({ name: "Saved Place" })
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

@ApiSchema({ name: "Comment Saved Place" })
export class CommentSavedPlaceDto {
    @ApiProperty()
    comment: string;
}

@ApiSchema({ name: "Rating Saved Place" })
export class RatingSavedPlaceDto {
    @ApiProperty()
    rating: number;
}

@ApiSchema({ name: "Place is Saved"})
export class PlaceIsSavedDto {
    @ApiProperty()
    id?: string;
    @ApiProperty()
    isSaved: boolean;
}