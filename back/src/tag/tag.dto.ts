import { ApiProperty } from "@nestjs/swagger";

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
    name: string;
    @ApiProperty()
    emoji: string;
}

export class TagDtoLight {
    @ApiProperty()
    name: string;
    @ApiProperty()
    emoji: string;
}
