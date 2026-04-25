import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from 'src/follow/follow.entity';
import { Place } from 'src/place/place.entity';
import { PlaceComment } from 'src/place-comment/place-comment.entity';
import { SavedPlace } from 'src/saved/saved.entity';
import { PlaceSuggestion } from 'src/suggestion/suggestion.entity';
import { Tag } from 'src/tag/tag.entity';
import {
  ACHIEVEMENTS,
  AchievementDefinition,
  UserStats,
} from './achievements.catalog';
import { UserGamification } from './gamification.entity';

export type GamificationAction =
  | 'save'
  | 'done'
  | 'rate'
  | 'comment'
  | 'tag'
  | 'place_create'
  | 'suggestion'
  | 'follow'
  | 'comment_public';

export const POINTS: Record<GamificationAction, number> = {
  save: 10,
  done: 20,
  rate: 5,
  comment: 3,
  tag: 2,
  place_create: 15,
  suggestion: 5,
  follow: 2,
  comment_public: 4,
};

export interface AwardResult {
  awardedPoints: number;
  newlyUnlocked: string[];
}

export interface AchievementCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: { current: number; target: number };
  unlocked: boolean;
}

export function levelFromPoints(points: number): {
  level: number;
  pointsInLevel: number;
  pointsForNextLevel: number;
  progress: number;
} {
  const safe = Math.max(points, 0);
  const level = Math.floor(Math.sqrt(safe / 50)) + 1;
  const currentLevelStart = (level - 1) * (level - 1) * 50;
  const nextLevelStart = level * level * 50;
  const pointsInLevel = safe - currentLevelStart;
  const pointsForNextLevel = nextLevelStart - currentLevelStart;
  const progress = pointsForNextLevel
    ? Math.min(1, Math.max(0, pointsInLevel / pointsForNextLevel))
    : 0;
  return { level, pointsInLevel, pointsForNextLevel, progress };
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(UserGamification.name)
    private gamificationModel: Model<UserGamification>,
    @InjectModel(SavedPlace.name)
    private savedPlaceModel: Model<SavedPlace>,
    @InjectModel(Place.name)
    private placeModel: Model<Place>,
    @InjectModel(Tag.name)
    private tagModel: Model<Tag>,
    @InjectModel(PlaceSuggestion.name)
    private suggestionModel: Model<PlaceSuggestion>,
    @InjectModel(Follow.name)
    private followModel: Model<Follow>,
    @InjectModel(PlaceComment.name)
    private commentModel: Model<PlaceComment>,
  ) {}

  async award(
    userId: string,
    action: GamificationAction,
  ): Promise<AwardResult> {
    const points = POINTS[action];
    const userObjectId = new Types.ObjectId(userId);

    const gam = await this.gamificationModel
      .findOneAndUpdate(
        { user: userObjectId },
        {
          $inc: { points },
          $setOnInsert: {
            user: userObjectId,
            achievements: [],
            backfilled: false,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    const stats = await this.computeStats(userId);
    const known = new Set(gam.achievements.map((a) => a.id));
    const newlyUnlocked: string[] = [];
    for (const def of ACHIEVEMENTS) {
      if (!known.has(def.id) && def.predicate(stats)) {
        await this.gamificationModel
          .updateOne(
            { user: userObjectId, 'achievements.id': { $ne: def.id } },
            {
              $addToSet: {
                achievements: { id: def.id, unlockedAt: new Date() },
              },
            },
          )
          .exec();
        newlyUnlocked.push(def.id);
      }
    }
    return { awardedPoints: points, newlyUnlocked };
  }

  async getProfile(userId: string): Promise<{
    points: number;
    level: number;
    pointsInLevel: number;
    pointsForNextLevel: number;
    progress: number;
    stats: UserStats;
    achievements: { id: string; unlockedAt: Date }[];
    catalog: AchievementCatalogItem[];
  }> {
    await this.backfillIfNeeded(userId);
    const gam = await this.ensureRecord(userId);
    const stats = await this.computeStats(userId);
    const level = levelFromPoints(gam.points);
    return {
      points: gam.points,
      level: level.level,
      pointsInLevel: level.pointsInLevel,
      pointsForNextLevel: level.pointsForNextLevel,
      progress: level.progress,
      stats,
      achievements: gam.achievements.map((a) => ({
        id: a.id,
        unlockedAt: a.unlockedAt,
      })),
      catalog: this.buildCatalog(
        stats,
        gam.achievements.map((a) => a.id),
      ),
    };
  }

  async backfillIfNeeded(userId: string): Promise<void> {
    const gam = await this.ensureRecord(userId);
    if (gam.backfilled) return;
    await this.recompute(userId);
  }

  async recompute(userId: string): Promise<void> {
    const gam = await this.ensureRecord(userId);
    const stats = await this.computeStats(userId);

    let points = 0;
    points += stats.savedCount * POINTS.save;
    points += stats.doneCount * POINTS.done;
    points += stats.ratedCount * POINTS.rate;
    points += stats.commentedCount * POINTS.comment;
    points += stats.placesCreated * POINTS.place_create;
    points += stats.suggestionsSubmitted * POINTS.suggestion;
    points += stats.uniqueTagsApplied * POINTS.tag;
    points += stats.followingCount * POINTS.follow;
    points += stats.publicCommentsCount * POINTS.comment_public;

    const now = new Date();
    const achievements: { id: string; unlockedAt: Date }[] = [];
    for (const def of ACHIEVEMENTS) {
      if (def.predicate(stats)) {
        achievements.push({ id: def.id, unlockedAt: now });
      }
    }

    gam.points = points;
    gam.achievements = achievements;
    gam.backfilled = true;
    await gam.save();
  }

  private buildCatalog(
    stats: UserStats,
    unlockedIds: string[],
  ): AchievementCatalogItem[] {
    const set = new Set(unlockedIds);
    return ACHIEVEMENTS.map((def: AchievementDefinition) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      progress: def.progress(stats),
      unlocked: set.has(def.id),
    }));
  }

  private async ensureRecord(userId: string): Promise<
    UserGamification & {
      save: () => Promise<UserGamification>;
      _id: unknown;
    }
  > {
    const userObjectId = new Types.ObjectId(userId);
    const gam = await this.gamificationModel
      .findOneAndUpdate(
        { user: userObjectId },
        {
          $setOnInsert: {
            user: userObjectId,
            points: 0,
            achievements: [],
            backfilled: false,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
    return gam as never;
  }

  private async computeStats(userId: string): Promise<UserStats> {
    const userObjectId = new Types.ObjectId(userId);

    const [
      savedCount,
      doneCount,
      ratedCount,
      fiveStarCount,
      commentedCount,
      tagsCreated,
      placesCreated,
      suggestionsSubmitted,
      uniqueTagsAggregation,
      followingCount,
      publicCommentsCount,
    ] = await Promise.all([
      this.savedPlaceModel.countDocuments({ user: userObjectId }).exec(),
      this.savedPlaceModel
        .countDocuments({ user: userObjectId, done: true })
        .exec(),
      this.savedPlaceModel
        .countDocuments({ user: userObjectId, rating: { $gte: 1 } })
        .exec(),
      this.savedPlaceModel
        .countDocuments({ user: userObjectId, rating: 5 })
        .exec(),
      this.savedPlaceModel
        .countDocuments({
          user: userObjectId,
          comment: { $exists: true, $ne: '' },
        })
        .exec(),
      this.tagModel.countDocuments({ owner: userObjectId }).exec(),
      this.placeModel.countDocuments({ createdBy: userObjectId }).exec(),
      this.suggestionModel.countDocuments({ user: userObjectId }).exec(),
      this.savedPlaceModel
        .aggregate<{
          _id: null;
          tags: Types.ObjectId[];
        }>([
          { $match: { user: userObjectId } },
          { $unwind: '$tags' },
          { $group: { _id: null, tags: { $addToSet: '$tags' } } },
        ])
        .exec(),
      this.followModel.countDocuments({ follower: userObjectId }),
      this.commentModel.countDocuments({ author: userObjectId }),
    ]);

    const uniqueTagsApplied = uniqueTagsAggregation[0]?.tags.length ?? 0;

    return {
      savedCount,
      doneCount,
      ratedCount,
      fiveStarCount,
      commentedCount,
      tagsCreated,
      uniqueTagsApplied,
      placesCreated,
      suggestionsSubmitted,
      followingCount,
      publicCommentsCount,
    };
  }
}
