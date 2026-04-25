import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  UserRegisterDto,
  UserDto,
  UserInfoDto,
  UserProfileDto,
  PublicMapSettingsDto,
} from 'src/user/user.dto';
import { User, UserRole, UserDocument } from 'src/user/user.entity';
import { UserMapper } from 'src/user/user.mapper';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: UserRegisterDto): Promise<UserDto> {
    const user = new this.userModel(createUserDto);
    const result = await user.save();

    return UserMapper.mapToDto(result);
  }

  async listProfiles(
    options: { limit?: number; offset?: number } = {},
  ): Promise<UserProfileDto[]> {
    const limit = clampLimit(options.limit);
    const offset = options.offset && options.offset > 0 ? options.offset : 0;
    const result = await this.userModel
      .find()
      .sort({ name: 1 })
      .skip(offset)
      .limit(limit)
      .exec();
    return UserMapper.mapToProfileDtoList(result);
  }

  async findProfile(id: string): Promise<UserProfileDto> {
    const result = await this.userModel.findById(id).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.mapToProfileDto(result);
  }

  async findByEmail(email: string): Promise<UserInfoDto> {
    const result = await this.userModel.findOne({ email }).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.mapToInfoDto(result);
  }

  async exists(email: string): Promise<boolean> {
    try {
      await this.findByEmail(email);
      return true;
    } catch {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async countAdmins(): Promise<number> {
    return this.userModel.countDocuments({ role: 'admin' }).exec();
  }

  async updateRole(id: string, role: UserRole): Promise<UserProfileDto> {
    if (role !== 'user' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin' && role === 'user') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    user.role = role;
    await user.save();
    return UserMapper.mapToProfileDto(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin');
      }
    }

    await this.userModel.deleteOne({ _id: id }).exec();
  }

  async getPublicMapSettings(id: string): Promise<PublicMapSettingsDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      isPublic: user.isPublic ?? false,
      publicSlug: user.publicSlug,
      publicToken: user.publicToken,
    };
  }

  async updatePublicMap(
    id: string,
    isPublic: boolean,
    publicSlug?: string,
  ): Promise<PublicMapSettingsDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (publicSlug !== undefined) {
      const trimmed = publicSlug.trim().toLowerCase();
      if (trimmed === '') {
        user.publicSlug = undefined;
      } else {
        if (!SLUG_RE.test(trimmed)) {
          throw new BadRequestException(
            'Slug must be 3-30 chars, lowercase letters/digits/hyphens, not starting or ending with a hyphen',
          );
        }
        if (trimmed !== user.publicSlug) {
          const taken = await this.userModel
            .exists({ publicSlug: trimmed, _id: { $ne: user._id } })
            .exec();
          if (taken) {
            throw new BadRequestException('Slug already taken');
          }
        }
        user.publicSlug = trimmed;
      }
    }

    if (isPublic && !user.publicSlug) {
      throw new BadRequestException(
        'A slug must be set before enabling public map',
      );
    }
    user.isPublic = isPublic;

    if (!user.publicToken) {
      user.publicToken = this.generateToken();
    }

    await user.save();
    return {
      isPublic: user.isPublic,
      publicSlug: user.publicSlug,
      publicToken: user.publicToken,
    };
  }

  async rotatePublicToken(id: string): Promise<PublicMapSettingsDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.publicToken = this.generateToken();
    await user.save();
    return {
      isPublic: user.isPublic ?? false,
      publicSlug: user.publicSlug,
      publicToken: user.publicToken,
    };
  }

  async isSlugAvailable(slug: string, ownerId?: string): Promise<boolean> {
    const trimmed = slug.trim().toLowerCase();
    if (!SLUG_RE.test(trimmed)) {
      return false;
    }
    const filter: Record<string, unknown> = { publicSlug: trimmed };
    if (ownerId) {
      filter._id = { $ne: ownerId };
    }
    const taken = await this.userModel.exists(filter).exec();
    return !taken;
  }

  async findBySlug(slug: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ publicSlug: slug.toLowerCase(), isPublic: true })
      .exec();
  }

  async findByPublicToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ publicToken: token }).exec();
  }

  private generateToken(): string {
    return randomBytes(24).toString('base64url');
  }
}

function clampLimit(value: number | undefined): number {
  if (!value || value <= 0) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}
