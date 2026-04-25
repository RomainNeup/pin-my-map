import { Types } from 'mongoose';
import {
  PublicUserDto,
  UserDto,
  UserInfoDto,
  UserProfileDto,
} from 'src/user/user.dto';
import { User } from 'src/user/user.entity';

type UserWithId = User & { _id: Types.ObjectId };

export class UserMapper {
  static mapToDto(entity: User): UserDto {
    return {
      name: entity.name,
      email: entity.email,
    };
  }

  static mapToInfoDto(entity: UserWithId): UserInfoDto {
    return {
      id: entity._id.toHexString(),
      name: entity.name,
      email: entity.email,
      password: entity.password,
      role: entity.role ?? 'user',
      status: entity.status ?? 'active',
      rejectionReason: entity.rejectionReason,
    };
  }

  static mapToInfoDtoList(entities: UserWithId[]): UserInfoDto[] {
    return entities.map((entity) => this.mapToInfoDto(entity));
  }

  static mapToProfileDto(entity: UserWithId): UserProfileDto {
    return {
      id: entity._id.toHexString(),
      name: entity.name,
      email: entity.email,
      role: entity.role ?? 'user',
      status: entity.status ?? 'active',
      rejectionReason: entity.rejectionReason,
    };
  }

  static mapToProfileDtoList(entities: UserWithId[]): UserProfileDto[] {
    return entities.map((entity) => this.mapToProfileDto(entity));
  }

  static mapToPublicDto(
    entity: UserWithId,
    points: number,
    level: number,
  ): PublicUserDto {
    return {
      id: entity._id.toHexString(),
      name: entity.name,
      publicSlug: entity.publicSlug,
      points,
      level,
    };
  }
}
