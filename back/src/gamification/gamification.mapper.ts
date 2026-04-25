import { AchievementDto, GamificationProfileDto } from './gamification.dto';
import { AchievementCatalogItem } from './gamification.service';

export class GamificationMapper {
  static toProfileDto(input: {
    points: number;
    level: number;
    pointsInLevel: number;
    pointsForNextLevel: number;
    progress: number;
    stats: GamificationProfileDto['stats'];
    achievements: { id: string; unlockedAt: Date }[];
    catalog: AchievementCatalogItem[];
  }): GamificationProfileDto {
    const unlockedAtMap = new Map(
      input.achievements.map((a) => [a.id, a.unlockedAt]),
    );
    const achievements: AchievementDto[] = input.catalog.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      progress: item.progress,
      unlocked: item.unlocked,
      unlockedAt: unlockedAtMap.get(item.id)?.toISOString(),
    }));

    return {
      points: input.points,
      level: input.level,
      pointsInLevel: input.pointsInLevel,
      pointsForNextLevel: input.pointsForNextLevel,
      progress: input.progress,
      stats: input.stats,
      achievements,
    };
  }
}
