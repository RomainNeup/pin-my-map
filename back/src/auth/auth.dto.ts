import { ApiProperty, ApiResponseProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@ApiSchema({ name: 'Register Request' })
export class RegisterRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email: string;
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

@ApiSchema({ name: 'Login Response' })
export class LoginResponseDto {
  @ApiResponseProperty()
  accessToken: string;
}

@ApiSchema({ name: 'Login Request' })
export class LoginRequestDto {
  @ApiProperty({ required: true })
  @IsEmail()
  @MaxLength(254)
  email: string;
  @ApiProperty({ required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
