import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@ApiSchema({ name: 'Place Comment' })
export class PlaceCommentDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  authorId: string;
  @ApiProperty()
  authorName: string;
  @ApiProperty({ required: false })
  authorSlug?: string;
  @ApiProperty()
  body: string;
  @ApiProperty()
  createdAt: Date;
}

@ApiSchema({ name: 'Create Comment Request' })
export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body: string;
}
