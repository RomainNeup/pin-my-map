import { ApiProperty, ApiResponseProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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

@ApiSchema({ name: 'Google OAuth Request' })
export class GoogleOAuthDto {
  @ApiProperty({ required: true, description: 'Google OIDC ID token' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  idToken: string;
}

@ApiSchema({ name: 'Apple OAuth Request' })
export class AppleOAuthDto {
  @ApiProperty({ required: true, description: 'Apple OIDC ID token' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  idToken: string;
  @ApiProperty({
    required: false,
    description:
      'Display name. Apple only sends this on the first sign-in via the JS SDK.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
