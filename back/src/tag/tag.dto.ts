import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const TAG_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export class TagDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  emoji: string;
  @ApiPropertyOptional({
    description: 'Hex color in the form #RRGGBB',
    example: '#cbd5e1',
  })
  color?: string;
}

export class CreateTagRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji: string;
  @ApiPropertyOptional({
    description: 'Hex color in the form #RRGGBB',
    example: '#cbd5e1',
  })
  @IsOptional()
  @IsString()
  @Matches(TAG_COLOR_REGEX, {
    message: 'color must be a hex color in the form #RRGGBB',
  })
  color?: string;
}

export class UpdateTagRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji: string;
  @ApiPropertyOptional({
    description: 'Hex color in the form #RRGGBB',
    example: '#cbd5e1',
  })
  @IsOptional()
  @IsString()
  @Matches(TAG_COLOR_REGEX, {
    message: 'color must be a hex color in the form #RRGGBB',
  })
  color?: string;
}
