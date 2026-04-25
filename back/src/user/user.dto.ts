import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole, UserStatus, USER_STATUSES } from './user.entity';

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
  status?: UserStatus;
}

/** Internal type used by the auth flow; not part of the public API surface. */
export class UserInfoDto {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  rejectionReason?: string;
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
  @ApiProperty({ enum: USER_STATUSES })
  status: UserStatus;
  @ApiProperty({ required: false })
  rejectionReason?: string;
}

@ApiSchema({ name: 'Public User' })
export class PublicUserDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ required: false })
  publicSlug?: string;
  @ApiProperty()
  points: number;
  @ApiProperty()
  level: number;
}

@ApiSchema({ name: 'Update User Role Request' })
export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'])
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

@ApiSchema({ name: 'Reject User Request' })
export class RejectUserRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ApiSchema({ name: 'Suspend User Request' })
export class SuspendUserRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ApiSchema({ name: 'Invite User Request' })
export class InviteUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email: string;
  @ApiProperty({ enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'])
  role: UserRole;
}

@ApiSchema({ name: 'Invite User Response' })
export class InviteUserResponseDto {
  @ApiProperty()
  user: UserProfileDto;
  @ApiProperty({
    required: false,
    description:
      'Temporary password. Returned only when the mailer is not yet wired; will be removed once mailer is in place.',
  })
  tempPassword?: string;
}

@ApiSchema({ name: 'Update Me Request' })
export class UpdateMeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @ApiProperty({ required: false })
  @ValidateIf((o: UpdateMeDto) => !!o.email)
  @IsString()
  @MinLength(1)
  currentPassword?: string;
}

@ApiSchema({ name: 'Change Password Request' })
export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword: string;
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

@ApiSchema({ name: 'Delete Me Request' })
export class DeleteMeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;
}
