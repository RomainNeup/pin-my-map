import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from 'src/follow/follow.entity';
import { FollowService } from 'src/follow/follow.service';
import { UserGamification } from 'src/gamification/gamification.entity';
import { levelFromPoints } from 'src/gamification/gamification.service';
import { SavedPlace } from 'src/saved/saved.entity';
import { SavedPlaceMapper } from 'src/saved/saved.mapper';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import {
  PublicMapDto,
  PublicMapStatsDto,
  PublicMapSummaryDto,
  PublicSavedPlaceDto,
} from './public-map.dto';

@Injectable()
export class PublicMapService {
  constructor(
    @InjectModel(SavedPlace.name)
    private savedPlaceModel: Model<SavedPlace>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Follow.name)
    private followModel: Model<Follow>,
    @InjectModel(UserGamification.name)
    private gamificationModel: Model<UserGamification>,
    private userService: UserService,
    private followService: FollowService,
  ) {}

  async discover(query?: string): Promise<PublicMapSummaryDto[]> {
    const filter: Record<string, unknown> = { isPublic: true };
    const trimmed = query?.trim();
    if (trimmed) {
      const safe = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { publicSlug: { $regex: safe, $options: 'i' } },
      ];
    }
    const users = await this.userModel
      .find(filter)
      .sort({ name: 1 })
      .limit(50)
      .exec();

    const userIds = users.map((u) => (u._id as Types.ObjectId).toString());

    const [savedAgg, followerCounts, gamificationRecords] = await Promise.all([
      this.savedPlaceModel.aggregate<{
        _id: Types.ObjectId;
        count: number;
      }>([
        {
          $match: {
            user: {
              $in: userIds.map((id) => new Types.ObjectId(id)),
            },
          },
        },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
      this.followService.getFollowerCounts(userIds),
      this.gamificationModel
        .find({
          user: { $in: userIds.map((id) => new Types.ObjectId(id)) },
        })
        .exec(),
    ]);

    const savedMap = new Map<string, number>();
    for (const r of savedAgg) {
      savedMap.set(r._id.toString(), r.count);
    }

    const gamMap = new Map<string, number>();
    for (const g of gamificationRecords) {
      gamMap.set((g.user as Types.ObjectId).toString(), g.points);
    }

    return users.map((u) => {
      const id = (u._id as Types.ObjectId).toString();
      const points = gamMap.get(id) ?? 0;
      const { level } = levelFromPoints(points);
      return {
        userId: id,
        name: u.name,
        publicSlug: u.publicSlug ?? '',
        savedCount: savedMap.get(id) ?? 0,
        followerCount: followerCounts.get(id) ?? 0,
        points,
        level,
      };
    });
  }

  async getStatsBySlug(slug: string): Promise<PublicMapStatsDto> {
    const user = await this.userService.findBySlug(slug);
    if (!user) {
      throw new NotFoundException('Public map not found');
    }
    return this.buildStats(user._id.toString());
  }

  async getFollowingPublicMaps(
    requesterId: string,
  ): Promise<PublicMapSummaryDto[]> {
    const requesterOid = new Types.ObjectId(requesterId);

    const followRows = await this.followModel
      .find({ follower: requesterOid })
      .exec();

    const followedIds = followRows
      .map((r) => (r.followed as unknown as Types.ObjectId).toString())
      .filter((id) => id !== requesterId);

    if (followedIds.length === 0) return [];

    const publicUsers = await this.userModel
      .find({
        _id: { $in: followedIds.map((id) => new Types.ObjectId(id)) },
        isPublic: true,
      })
      .sort({ name: 1 })
      .exec();

    const publicUserIds = publicUsers.map((u) =>
      (u._id as Types.ObjectId).toString(),
    );

    if (publicUserIds.length === 0) return [];

    const [savedAgg, followerCounts, gamificationRecords] = await Promise.all([
      this.savedPlaceModel.aggregate<{
        _id: Types.ObjectId;
        count: number;
      }>([
        {
          $match: {
            user: {
              $in: publicUserIds.map((id) => new Types.ObjectId(id)),
            },
          },
        },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
      this.followService.getFollowerCounts(publicUserIds),
      this.gamificationModel
        .find({
          user: { $in: publicUserIds.map((id) => new Types.ObjectId(id)) },
        })
        .exec(),
    ]);

    const savedMap = new Map<string, number>();
    for (const r of savedAgg) {
      savedMap.set(r._id.toString(), r.count);
    }

    const gamMap = new Map<string, number>();
    for (const g of gamificationRecords) {
      gamMap.set((g.user as Types.ObjectId).toString(), g.points);
    }

    return publicUsers.map((u) => {
      const id = (u._id as Types.ObjectId).toString();
      const points = gamMap.get(id) ?? 0;
      const { level } = levelFromPoints(points);
      return {
        userId: id,
        name: u.name,
        publicSlug: u.publicSlug ?? '',
        savedCount: savedMap.get(id) ?? 0,
        followerCount: followerCounts.get(id) ?? 0,
        points,
        level,
      };
    });
  }

  async getBySlug(slug: string): Promise<PublicMapDto> {
    const user = await this.userService.findBySlug(slug);
    if (!user) {
      throw new NotFoundException('Public map not found');
    }
    return this.buildPublicMap(user._id.toString(), user.name, user.publicSlug);
  }

  async getByToken(token: string): Promise<PublicMapDto> {
    const user = await this.userService.findByPublicToken(token);
    if (!user) {
      throw new NotFoundException('Public map not found');
    }
    return this.buildPublicMap(user._id.toString(), user.name, user.publicSlug);
  }

  async getSavedPlaceForSlug(
    slug: string,
    savedPlaceId: string,
  ): Promise<PublicSavedPlaceDto> {
    const user = await this.userService.findBySlug(slug);
    if (!user) {
      throw new NotFoundException('Public map not found');
    }
    const sp = await this.savedPlaceModel
      .findOne({ user: user._id, _id: savedPlaceId })
      .populate(['place', 'tags'])
      .exec();
    if (!sp) {
      throw new NotFoundException('Saved place not found');
    }
    return SavedPlaceMapper.toPublicDto(sp);
  }

  async getSavedPlaceForToken(
    token: string,
    savedPlaceId: string,
  ): Promise<PublicSavedPlaceDto> {
    const user = await this.userService.findByPublicToken(token);
    if (!user) {
      throw new NotFoundException('Public map not found');
    }
    const sp = await this.savedPlaceModel
      .findOne({ user: user._id, _id: savedPlaceId })
      .populate(['place', 'tags'])
      .exec();
    if (!sp) {
      throw new NotFoundException('Saved place not found');
    }
    return SavedPlaceMapper.toPublicDto(sp);
  }

  private async buildStats(userId: string): Promise<PublicMapStatsDto> {
    const userOid = new Types.ObjectId(userId);
    const [savedCount, doneCount, tagAgg] = await Promise.all([
      this.savedPlaceModel.countDocuments({ user: userOid }).exec(),
      this.savedPlaceModel.countDocuments({ user: userOid, done: true }).exec(),
      this.savedPlaceModel.aggregate<{
        _id: null;
        tags: Types.ObjectId[];
      }>([
        { $match: { user: userOid } },
        { $unwind: '$tags' },
        { $group: { _id: null, tags: { $addToSet: '$tags' } } },
      ]),
    ]);
    const tagCount = tagAgg[0]?.tags.length ?? 0;
    return { savedCount, doneCount, tagCount };
  }

  private async buildPublicMap(
    userId: string,
    name: string,
    publicSlug?: string,
  ): Promise<PublicMapDto> {
    const savedPlaces = await this.savedPlaceModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .populate(['place', 'tags'])
      .exec();
    return {
      owner: { userId, name, publicSlug },
      savedPlaces: SavedPlaceMapper.toPublicDtoList(savedPlaces),
    };
  }
}
