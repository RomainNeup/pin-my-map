import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { UserRole } from './user.entity';

export class UserDto {
  @ApiProperty({ required: true })
  name: string;
  @ApiProperty({ required: true })
  email: string;
}

export class UserRegisterDto {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
}

/** Internal type used by the auth flow; not part of the public API surface. */
export class UserInfoDto {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

@ApiSchema({ name: 'User Profile' })
export class UserProfileDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiProperty({ enum: ['user', 'admin'] })
  role: UserRole;
}

@ApiSchema({ name: 'Update User Role Request' })
export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['user', 'admin'] })
  role: UserRole;
}

@ApiSchema({ name: 'Public Map Settings' })
export class PublicMapSettingsDto {
  @ApiProperty()
  isPublic: boolean;
  @ApiProperty({ required: false })
  publicSlug?: string;
  @ApiProperty({ required: false })
  publicToken?: string;
}

@ApiSchema({ name: 'Update Public Map Request' })
export class UpdatePublicMapDto {
  @ApiProperty()
  isPublic: boolean;
  @ApiProperty({ required: false })
  publicSlug?: string;
}

@ApiSchema({ name: 'Slug Availability' })
export class SlugAvailabilityDto {
  @ApiProperty()
  available: boolean;
}
