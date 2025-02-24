import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
    @ApiProperty({ required: true })
    name: string;
    @ApiProperty({ required: true })
    email: string;
}

export class UserRegisterDto {
    name: string;
    email: string;
    password: string;
    salt: string;
}

export class UserInfoDto {
    id: string;
    @ApiProperty({ required: true })
    name: string;
    @ApiProperty({ required: true })
    email: string;
    @ApiProperty({ required: true })
    password: string;
}