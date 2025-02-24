import { ApiProperty, ApiResponseProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({name: "Register Request"})
export class RegisterRequestDto {
    @ApiProperty()
    name: string;
    @ApiProperty()
    email: string;
    @ApiProperty()
    password: string;
}

@ApiSchema({name: "Login Response"})
export class LoginResponseDto {
    @ApiResponseProperty()
    accessToken: string;
}

@ApiSchema({name: "Login Request"})
export class LoginRequestDto {
    @ApiProperty({ required: true })
    email: string;
    @ApiProperty({ required: true })
    password: string;
}