import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'User Stats' })
export class UserStatsDto {
  @ApiProperty()
  savedCount: number;
  @ApiProperty()
  doneCount: number;
  @ApiProperty()
  ratedCount: number;
  @ApiProperty()
  fiveStarCount: number;
  @ApiProperty()
  commentedCount: number;
  @ApiProperty()
  tagsCreated: number;
  @ApiProperty()
  uniqueTagsApplied: number;
  @ApiProperty()
  placesCreated: number;
  @ApiProperty()
  suggestionsSubmitted: number;
  @ApiProperty()
  followingCount: number;
  @ApiProperty()
  publicCommentsCount: number;
}

@ApiSchema({ name: 'Achievement Progress' })
export class AchievementProgressDto {
  @ApiProperty()
  current: number;
  @ApiProperty()
  target: number;
}

@ApiSchema({ name: 'Achievement' })
export class AchievementDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  icon: string;
  @ApiProperty({ type: AchievementProgressDto })
  progress: AchievementProgressDto;
  @ApiProperty()
  unlocked: boolean;
  @ApiProperty({ required: false })
  unlockedAt?: string;
}

@ApiSchema({ name: 'Gamification Profile' })
export class GamificationProfileDto {
  @ApiProperty()
  points: number;
  @ApiProperty()
  level: number;
  @ApiProperty()
  pointsInLevel: number;
  @ApiProperty()
  pointsForNextLevel: number;
  @ApiProperty({ description: '0..1 progress to next level' })
  progress: number;
  @ApiProperty({ type: UserStatsDto })
  stats: UserStatsDto;
  @ApiProperty({ type: [AchievementDto] })
  achievements: AchievementDto[];
}
