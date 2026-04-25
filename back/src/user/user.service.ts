import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  UserRegisterDto,
  UserDto,
  UserInfoDto,
  UserProfileDto,
  PublicMapSettingsDto,
  PublicUserDto,
  UpdateMeDto,
} from 'src/user/user.dto';
import { User, UserRole, UserStatus, UserDocument } from 'src/user/user.entity';
import { UserMapper } from 'src/user/user.mapper';
import { levelFromPoints } from 'src/gamification/gamification.service';
import { UserGamification } from 'src/gamification/gamification.entity';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const SEARCH_LIMIT = 20;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserGamification.name)
    private gamificationModel: Model<UserGamification>,
  ) {}

  async onModuleInit(): Promise<void> {
    // Backfill: any pre-existing user without a status becomes 'active'.
    await this.userModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } },
    );
  }

  async create(createUserDto: UserRegisterDto): Promise<UserDto> {
    const user = new this.userModel(createUserDto);
    const result = await user.save();

    return UserMapper.mapToDto(result);
  }

  async listProfiles(
    options: {
      limit?: number;
      offset?: number;
      q?: string;
      status?: UserStatus;
    } = {},
  ): Promise<UserProfileDto[]> {
    const limit = clampLimit(options.limit);
    const offset = options.offset && options.offset > 0 ? options.offset : 0;

    const filter: Record<string, unknown> = {};
    if (options.status) {
      filter.status = options.status;
    }
    if (options.q && options.q.trim()) {
      const trimmed = options.q.trim();
      const re = new RegExp(escapeRegex(trimmed), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const result = await this.userModel
      .find(filter)
      .sort({ name: 1 })
      .skip(offset)
      .limit(limit);
    return UserMapper.mapToProfileDtoList(result);
  }

  async listPending(): Promise<UserProfileDto[]> {
    const result = await this.userModel
      .find({ status: 'pending' })
      .sort({ name: 1 });
    return UserMapper.mapToProfileDtoList(result);
  }

  async findProfile(id: string): Promise<UserProfileDto> {
    const result = await this.userModel.findById(id);

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.mapToProfileDto(result);
  }

  async findByEmail(email: string): Promise<UserInfoDto> {
    const result = await this.userModel.findOne({ email });

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
    return this.userModel.countDocuments();
  }

  async countAdmins(): Promise<number> {
    return this.userModel.countDocuments({ role: 'admin' });
  }

  async updateRole(id: string, role: UserRole): Promise<UserProfileDto> {
    if (role !== 'user' && role !== 'admin') {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.userModel.findById(id);
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

  async approve(id: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.status = 'active';
    user.rejectionReason = undefined;
    await user.save();
    return UserMapper.mapToProfileDto(user);
  }

  async reject(id: string, reason?: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot reject the last admin');
      }
    }
    user.status = 'rejected';
    user.rejectionReason = reason;
    await user.save();
    return UserMapper.mapToProfileDto(user);
  }

  async suspend(id: string, reason?: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot suspend the last admin');
      }
    }
    user.status = 'suspended';
    user.rejectionReason = reason;
    await user.save();
    return UserMapper.mapToProfileDto(user);
  }

  async unsuspend(id: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.status = 'active';
    user.rejectionReason = undefined;
    await user.save();
    return UserMapper.mapToProfileDto(user);
  }

  async invite(
    name: string,
    email: string,
    role: UserRole,
  ): Promise<{ user: UserProfileDto; tempPassword: string }> {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const tempPassword = randomBytes(12).toString('base64url');
    const hashed = await bcrypt.hash(tempPassword, 10);
    const created = await this.userModel.create({
      name,
      email,
      password: hashed,
      role,
      status: 'active',
    });
    return {
      user: UserMapper.mapToProfileDto(created),
      tempPassword,
    };
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin');
      }
    }

    await this.userModel.deleteOne({ _id: id });
  }

  async updateMe(id: string, body: UpdateMeDto): Promise<UserProfileDto> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (body.email && body.email !== user.email) {
      if (!body.currentPassword) {
        throw new BadRequestException(
          'currentPassword is required to change email',
        );
      }
      if (!user.password) {
        throw new UnauthorizedException(
          'Account has no password (OAuth-only). Use provider sign-in to change email.',
        );
      }
      const ok = await bcrypt.compare(body.currentPassword, user.password);
      if (!ok) {
        throw new UnauthorizedException('Invalid current password');
      }
      const taken = await this.userModel.findOne({
        email: body.email,
        _id: { $ne: user._id },
      });
      if (taken) {
        throw new ConflictException('Email already in use');
      }
      user.email = body.email;
    }

    if (body.name !== undefined) {
      user.name = body.name;
    }

    await user.save();
    return UserMapper.mapToProfileDto(user);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new UnauthorizedException('Account has no password set');
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid current password');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async softDeleteMe(id: string, password: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new UnauthorizedException('Account has no password set');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid password');
    }
    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin');
      }
    }
    user.status = 'rejected';
    user.rejectionReason = 'self-deleted';
    user.email = `deleted-${user._id.toHexString()}@deleted.local`;
    user.isPublic = false;
    user.publicSlug = undefined;
    user.publicToken = undefined;
    await user.save();
  }

  async search(q: string, requesterId: string): Promise<PublicUserDto[]> {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('q must be at least 2 characters');
    }
    const re = new RegExp(escapeRegex(trimmed), 'i');
    const requesterObjectId = Types.ObjectId.isValid(requesterId)
      ? new Types.ObjectId(requesterId)
      : null;

    const filter: Record<string, unknown> = {
      isPublic: true,
      status: 'active',
      $or: [{ name: re }, { publicSlug: re }],
    };
    if (requesterObjectId) {
      filter._id = { $ne: requesterObjectId };
    }

    const users = await this.userModel
      .find(filter)
      .sort({ name: 1 })
      .limit(SEARCH_LIMIT);

    if (users.length === 0) return [];

    const userIds = users.map((u) => u._id);
    const gam = await this.gamificationModel.find({
      user: { $in: userIds },
    });
    const pointsByUser = new Map<string, number>();
    for (const g of gam) {
      pointsByUser.set(g.user.toHexString(), g.points);
    }

    return users.map((u) => {
      const points = pointsByUser.get(u._id.toHexString()) ?? 0;
      const level = levelFromPoints(points).level;
      return UserMapper.mapToPublicDto(u, points, level);
    });
  }

  async getPublicMapSettings(id: string): Promise<PublicMapSettingsDto> {
    const user = await this.userModel.findById(id);
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
    const user = await this.userModel.findById(id);
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
          const taken = await this.userModel.exists({
            publicSlug: trimmed,
            _id: { $ne: user._id },
          });
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
    const user = await this.userModel.findById(id);
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
    const taken = await this.userModel.exists(filter);
    return !taken;
  }

  async findBySlug(slug: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      publicSlug: slug.toLowerCase(),
      isPublic: true,
    });
  }

  async findByPublicToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ publicToken: token });
  }

  private generateToken(): string {
    return randomBytes(24).toString('base64url');
  }
}

function clampLimit(value: number | undefined): number {
  if (!value || value <= 0) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}
