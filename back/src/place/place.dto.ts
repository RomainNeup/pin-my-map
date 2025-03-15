import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({ name: "Create Place Request" })
export class CreatePlaceRequestDto {
    @ApiProperty()
    name: string;
    @ApiProperty({
        type: 'object',
        properties: {
            lat: {
                type: 'number'
            },
            lng: {
                type: 'number'
            }
        },
    })
    location: { lat: number, lng: number };
    @ApiProperty()
    address: string;
    @ApiProperty()
    description: string;
    @ApiProperty({ required: false })
    image: string;
}

@ApiSchema({ name: "Place" })
export class PlaceDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    name: string;
    @ApiProperty({
        type: 'object',
        properties: {
            lat: {
                type: 'number'
            },
            lng: {
                type: 'number'
            }
        },
    })
    location: { lat: number, lng: number };
    @ApiProperty()
    address: string;
    @ApiProperty()
    description: string;
    @ApiProperty()
    image: string;
}
