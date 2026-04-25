import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TagDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  emoji: string;
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
}
