import { axiosInstance } from './base';

export interface UserStats {
	savedCount: number;
	doneCount: number;
	ratedCount: number;
	fiveStarCount: number;
	commentedCount: number;
	tagsCreated: number;
	uniqueTagsApplied: number;
	placesCreated: number;
	suggestionsSubmitted: number;
}

export interface AchievementProgress {
	current: number;
	target: number;
}

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	progress: AchievementProgress;
	unlocked: boolean;
	unlockedAt?: string;
}

export interface GamificationProfile {
	points: number;
	level: number;
	pointsInLevel: number;
	pointsForNextLevel: number;
	progress: number;
	stats: UserStats;
	achievements: Achievement[];
}

export function getGamificationProfile(): Promise<GamificationProfile> {
	return axiosInstance.get<GamificationProfile>('/gamification/me').then(({ data }) => data);
}
