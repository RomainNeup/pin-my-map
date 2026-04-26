import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from 'src/follow/follow.entity';
import { Place } from 'src/place/place.entity';
import { PlaceComment } from 'src/place-comment/place-comment.entity';
import { SavedPlace } from 'src/saved/saved.entity';
import { PlaceSuggestion } from 'src/suggestion/suggestion.entity';
import { Tag } from 'src/tag/tag.entity';
import { User } from 'src/user/user.entity';
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

/**
 * Extract a country hint from a place address string.
 * Naive heuristic: take the last non-empty comma-delimited segment, trimmed.
 */
export function extractCountryFromAddress(address: string | undefined): string {
  if (!address) return '';
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/**
 * Compute the number of distinct calendar days (UTC) on which saved places
 * were created between 22:00 and 04:00 UTC.
 */
export function computeNightOwlDays(dates: Date[]): number {
  const daySet = new Set<string>();
  for (const d of dates) {
    const hour = d.getUTCHours();
    if (hour >= 22 || hour < 4) {
      daySet.add(d.toISOString().slice(0, 10));
    }
  }
  return daySet.size;
}

/**
 * Compute the longest streak of consecutive calendar months (YYYY-MM) that
 * contain at least one saved-place creation timestamp.
 */
export function computeConsecutiveActiveMonths(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const months = new Set(
    dates.map((d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }),
  );

  const sorted = Array.from(months).sort();
  let maxStreak = 1;
  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const [py, pm] = sorted[i - 1].split('-').map(Number);
    const [cy, cm] = sorted[i].split('-').map(Number);
    const diffMonths = (cy - py) * 12 + (cm - pm);
    if (diffMonths === 1) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 1;
    }
  }

  return maxStreak;
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
    @InjectModel(User.name)
    private userModel: Model<User>,
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

  async computeStats(userId: string): Promise<UserStats> {
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
      approvedSuggestionsCount,
      uniqueTagsAggregation,
      followingCount,
      followerCount,
      publicCommentsCount,
      userRecord,
      savedPlaceDates,
      savedPlaceAddresses,
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
      this.suggestionModel
        .countDocuments({ user: userObjectId, status: 'approved' })
        .exec(),
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
      this.followModel.countDocuments({ followed: userObjectId }),
      this.commentModel.countDocuments({ author: userObjectId }),
      this.userModel
        .findById(userObjectId)
        .select('publicSlug isPublic createdAt')
        .lean()
        .exec(),
      this.savedPlaceModel
        .find({ user: userObjectId })
        .select('createdAt')
        .lean()
        .exec(),
      this.savedPlaceModel
        .find({ user: userObjectId })
        .populate({ path: 'place', select: 'address' })
        .select('place')
        .lean()
        .exec(),
    ]);

    const uniqueTagsApplied = uniqueTagsAggregation[0]?.tags.length ?? 0;

    // Globe-trotter: distinct countries from place addresses
    const countries = new Set<string>();
    for (const sp of savedPlaceAddresses) {
      const place = sp.place as { address?: string } | null;
      const country = extractCountryFromAddress(place?.address);
      if (country) countries.add(country.toLowerCase());
    }
    const countryCount = countries.size;

    // Night Owl: calendar days with saves between 22:00 and 04:00
    const dates = (savedPlaceDates as Array<{ createdAt?: Date }>)
      .map((sp) => sp.createdAt)
      .filter((d): d is Date => d instanceof Date);
    const nightOwlDays = computeNightOwlDays(dates);

    // Comeback Kid: longest run of consecutive active months
    const consecutiveActiveMonths = computeConsecutiveActiveMonths(dates);

    // Map Crafter: publicSlug set and isPublic true
    const user = userRecord as {
      publicSlug?: string;
      isPublic?: boolean;
      createdAt?: Date;
    } | null;
    const isPublicMapEnabled = !!(user?.publicSlug && user?.isPublic === true);

    // Veteran: account age in days
    const accountAgeDays = user?.createdAt
      ? Math.floor(
          (Date.now() - new Date(user.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

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
      // New fields
      followerCount,
      approvedSuggestionsCount,
      countryCount,
      nightOwlDays,
      isPublicMapEnabled,
      accountAgeDays,
      consecutiveActiveMonths,
    };
  }
}
