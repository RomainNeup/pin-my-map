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
  followingCount: number;
  publicCommentsCount: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  predicate: (s: UserStats) => boolean;
  progress: (s: UserStats) => { current: number; target: number };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_pin',
    name: 'First Pin',
    description: 'Save your first place',
    icon: '📍',
    predicate: (s) => s.savedCount >= 1,
    progress: (s) => ({ current: Math.min(s.savedCount, 1), target: 1 }),
  },
  {
    id: 'pinning_pro',
    name: 'Pinning Pro',
    description: 'Save 25 places',
    icon: '🗺️',
    predicate: (s) => s.savedCount >= 25,
    progress: (s) => ({ current: Math.min(s.savedCount, 25), target: 25 }),
  },
  {
    id: 'pin_legend',
    name: 'Pin Legend',
    description: 'Save 100 places',
    icon: '🏆',
    predicate: (s) => s.savedCount >= 100,
    progress: (s) => ({ current: Math.min(s.savedCount, 100), target: 100 }),
  },
  {
    id: 'done_and_dusted',
    name: 'Done & Dusted',
    description: 'Mark 10 places as visited',
    icon: '✅',
    predicate: (s) => s.doneCount >= 10,
    progress: (s) => ({ current: Math.min(s.doneCount, 10), target: 10 }),
  },
  {
    id: 'dedicated_traveler',
    name: 'Dedicated Traveler',
    description: 'Mark 50 places as visited',
    icon: '🧳',
    predicate: (s) => s.doneCount >= 50,
    progress: (s) => ({ current: Math.min(s.doneCount, 50), target: 50 }),
  },
  {
    id: 'critic',
    name: 'Critic',
    description: 'Rate 20 places',
    icon: '⭐',
    predicate: (s) => s.ratedCount >= 20,
    progress: (s) => ({ current: Math.min(s.ratedCount, 20), target: 20 }),
  },
  {
    id: 'five_star_curator',
    name: 'Five-Star Curator',
    description: 'Give 10 places a 5-star rating',
    icon: '🌟',
    predicate: (s) => s.fiveStarCount >= 10,
    progress: (s) => ({ current: Math.min(s.fiveStarCount, 10), target: 10 }),
  },
  {
    id: 'wordsmith',
    name: 'Wordsmith',
    description: 'Add comments to 10 places',
    icon: '📝',
    predicate: (s) => s.commentedCount >= 10,
    progress: (s) => ({ current: Math.min(s.commentedCount, 10), target: 10 }),
  },
  {
    id: 'tag_enthusiast',
    name: 'Tag Enthusiast',
    description: 'Create 5 tags',
    icon: '🏷️',
    predicate: (s) => s.tagsCreated >= 5,
    progress: (s) => ({ current: Math.min(s.tagsCreated, 5), target: 5 }),
  },
  {
    id: 'tag_master',
    name: 'Tag Master',
    description: 'Create 20 tags',
    icon: '🎨',
    predicate: (s) => s.tagsCreated >= 20,
    progress: (s) => ({ current: Math.min(s.tagsCreated, 20), target: 20 }),
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    description: 'Create your first place',
    icon: '🚩',
    predicate: (s) => s.placesCreated >= 1,
    progress: (s) => ({ current: Math.min(s.placesCreated, 1), target: 1 }),
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    description: 'Create 5 places',
    icon: '🗺️',
    predicate: (s) => s.placesCreated >= 5,
    progress: (s) => ({ current: Math.min(s.placesCreated, 5), target: 5 }),
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Follow 5 other explorers',
    icon: '🦋',
    predicate: (s) => s.followingCount >= 5,
    progress: (s) => ({ current: Math.min(s.followingCount, 5), target: 5 }),
  },
  {
    id: 'community_voice',
    name: 'Community Voice',
    description: 'Leave 10 comments on public places',
    icon: '💬',
    predicate: (s) => s.publicCommentsCount >= 10,
    progress: (s) => ({
      current: Math.min(s.publicCommentsCount, 10),
      target: 10,
    }),
  },
  {
    id: 'helpful_neighbor',
    name: 'Helpful Neighbor',
    description: 'Submit 10 edit suggestions',
    icon: '🤝',
    predicate: (s) => s.suggestionsSubmitted >= 10,
    progress: (s) => ({
      current: Math.min(s.suggestionsSubmitted, 10),
      target: 10,
    }),
  },
];
