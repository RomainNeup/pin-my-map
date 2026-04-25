import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FollowService } from 'src/follow/follow.service';
import { SavedPlace } from 'src/saved/saved.entity';
import { SavedPlaceMapper } from 'src/saved/saved.mapper';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import {
  PublicMapDto,
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

    const [savedAgg, followerCounts] = await Promise.all([
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
    ]);

    const savedMap = new Map<string, number>();
    for (const r of savedAgg) {
      savedMap.set(r._id.toString(), r.count);
    }

    return users.map((u) => {
      const id = (u._id as Types.ObjectId).toString();
      return {
        userId: id,
        name: u.name,
        publicSlug: u.publicSlug ?? '',
        savedCount: savedMap.get(id) ?? 0,
        followerCount: followerCounts.get(id) ?? 0,
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
