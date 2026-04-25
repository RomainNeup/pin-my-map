import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GamificationService } from 'src/gamification/gamification.service';
import { User } from 'src/user/user.entity';
import { Follow } from './follow.entity';
import { FollowStatsDto, FollowUserDto, IsFollowingDto } from './follow.dto';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @InjectModel(User.name) private userModel: Model<User>,
    private gamificationService: GamificationService,
  ) {}

  async follow(
    followerId: string,
    followedId: string,
  ): Promise<FollowStatsDto> {
    if (followerId === followedId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    if (!Types.ObjectId.isValid(followedId)) {
      throw new BadRequestException('Invalid user id');
    }
    const target = await this.userModel.findById(followedId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const followerOid = new Types.ObjectId(followerId);
    const followedOid = new Types.ObjectId(followedId);

    const existing = await this.followModel.findOne({
      follower: followerOid,
      followed: followedOid,
    });

    if (!existing) {
      await this.followModel.create({
        follower: followerOid,
        followed: followedOid,
      });
      try {
        await this.gamificationService.award(followerId, 'follow');
      } catch {
        // never let gamification break the primary action
      }
    }

    return this.getStats(followerId, followedId);
  }

  async unfollow(
    followerId: string,
    followedId: string,
  ): Promise<FollowStatsDto> {
    if (!Types.ObjectId.isValid(followedId)) {
      throw new BadRequestException('Invalid user id');
    }
    await this.followModel.deleteOne({
      follower: new Types.ObjectId(followerId),
      followed: new Types.ObjectId(followedId),
    });
    return this.getStats(followerId, followedId);
  }

  async getStats(
    viewerId: string | null,
    targetId: string,
  ): Promise<FollowStatsDto> {
    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid user id');
    }
    const targetOid = new Types.ObjectId(targetId);
    const [followerCount, followingCount, isFollowing] = await Promise.all([
      this.followModel.countDocuments({ followed: targetOid }),
      this.followModel.countDocuments({ follower: targetOid }),
      viewerId
        ? this.followModel
            .exists({
              follower: new Types.ObjectId(viewerId),
              followed: targetOid,
            })
            .then((d) => !!d)
        : Promise.resolve(false),
    ]);
    return { followerCount, followingCount, isFollowing };
  }

  async isFollowing(
    followerId: string,
    followedId: string,
  ): Promise<IsFollowingDto> {
    if (!Types.ObjectId.isValid(followedId)) {
      throw new BadRequestException('Invalid user id');
    }
    const exists = await this.followModel.exists({
      follower: new Types.ObjectId(followerId),
      followed: new Types.ObjectId(followedId),
    });
    return { following: !!exists };
  }

  async listFollowing(userId: string): Promise<FollowUserDto[]> {
    const rows = await this.followModel
      .find({ follower: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate<{ followed: User & { _id: Types.ObjectId } }>('followed')
      .exec();
    return rows
      .filter((r) => r.followed)
      .map((r) => ({
        userId: r.followed._id.toString(),
        name: r.followed.name,
        publicSlug: r.followed.publicSlug,
        isPublic: r.followed.isPublic ?? false,
        followedAt: r.createdAt,
      }));
  }

  async listFollowers(userId: string): Promise<FollowUserDto[]> {
    const rows = await this.followModel
      .find({ followed: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate<{ follower: User & { _id: Types.ObjectId } }>('follower')
      .exec();
    return rows
      .filter((r) => r.follower)
      .map((r) => ({
        userId: r.follower._id.toString(),
        name: r.follower.name,
        publicSlug: r.follower.publicSlug,
        isPublic: r.follower.isPublic ?? false,
        followedAt: r.createdAt,
      }));
  }

  async getFollowerCounts(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const oids = userIds.map((id) => new Types.ObjectId(id));
    const rows = await this.followModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { followed: { $in: oids } } },
      { $group: { _id: '$followed', count: { $sum: 1 } } },
    ]);
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r._id.toString(), r.count);
    }
    return map;
  }
}
