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
  // Extended stats for new achievements
  followerCount: number;
  approvedSuggestionsCount: number;
  countryCount: number;
  nightOwlDays: number;
  isPublicMapEnabled: boolean;
  accountAgeDays: number;
  consecutiveActiveMonths: number;
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
  // ── Existing 15 achievements ──────────────────────────────────────────────
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

  // ── 10 New achievements ───────────────────────────────────────────────────

  /**
   * Globe-trotter: saved places in 5 different countries.
   * Country is derived from the last comma-separated segment of the place address.
   */
  {
    id: 'globe_trotter',
    name: 'Globe-trotter',
    description: 'Save places in 5 different countries',
    icon: '🌍',
    predicate: (s) => s.countryCount >= 5,
    progress: (s) => ({ current: Math.min(s.countryCount, 5), target: 5 }),
  },

  /**
   * Night Owl: added saved places between 22:00 and 04:00 on 5 distinct calendar days.
   */
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Save places between 22:00 and 04:00 on 5 different nights',
    icon: '🦉',
    predicate: (s) => s.nightOwlDays >= 5,
    progress: (s) => ({ current: Math.min(s.nightOwlDays, 5), target: 5 }),
  },

  /**
   * Harsh Critic: rate 25 places (step up from existing 'critic' at 20).
   */
  {
    id: 'harsh_critic',
    name: 'Harsh Critic',
    description: 'Rate 25 places',
    icon: '🔬',
    predicate: (s) => s.ratedCount >= 25,
    progress: (s) => ({ current: Math.min(s.ratedCount, 25), target: 25 }),
  },

  /**
   * Curator: create 10 tags.
   */
  {
    id: 'curator',
    name: 'Curator',
    description: 'Create 10 tags to organise your places',
    icon: '🗂️',
    predicate: (s) => s.tagsCreated >= 10,
    progress: (s) => ({ current: Math.min(s.tagsCreated, 10), target: 10 }),
  },

  /**
   * Completionist: mark ≥80% of saved places as done (minimum 10 saved).
   */
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Mark at least 80% of your saved places as visited (min. 10)',
    icon: '🎯',
    predicate: (s) => s.savedCount >= 10 && s.doneCount / s.savedCount >= 0.8,
    progress: (s) => {
      if (s.savedCount < 10) {
        return { current: s.savedCount, target: 10 };
      }
      const pct = Math.floor((s.doneCount / s.savedCount) * 100);
      return { current: Math.min(pct, 80), target: 80 };
    },
  },

  /**
   * Map Crafter: has a non-default publicSlug and isPublic:true.
   */
  {
    id: 'map_crafter',
    name: 'Map Crafter',
    description: 'Enable your public map with a custom slug',
    icon: '🔗',
    predicate: (s) => s.isPublicMapEnabled,
    progress: (s) => ({ current: s.isPublicMapEnabled ? 1 : 0, target: 1 }),
  },

  /**
   * Popular Explorer: follow 10 users and be followed by 5.
   */
  {
    id: 'popular_explorer',
    name: 'Popular Explorer',
    description: 'Follow 10 explorers and be followed by 5',
    icon: '🌟',
    predicate: (s) => s.followingCount >= 10 && s.followerCount >= 5,
    progress: (s) => ({
      current: Math.min(s.followingCount, 10) + Math.min(s.followerCount, 5),
      target: 15,
    }),
  },

  /**
   * Approved!: had 5 edit suggestions approved.
   */
  {
    id: 'approved',
    name: 'Approved!',
    description: 'Get 5 of your place suggestions approved',
    icon: '✔️',
    predicate: (s) => s.approvedSuggestionsCount >= 5,
    progress: (s) => ({
      current: Math.min(s.approvedSuggestionsCount, 5),
      target: 5,
    }),
  },

  /**
   * Veteran: account is older than 1 year (365 days).
   */
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Your account is over a year old',
    icon: '🎖️',
    predicate: (s) => s.accountAgeDays >= 365,
    progress: (s) => ({
      current: Math.min(s.accountAgeDays, 365),
      target: 365,
    }),
  },

  /**
   * Comeback Kid: saved at least one place per month for 3 consecutive months.
   */
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Save at least one place per month for 3 consecutive months',
    icon: '🔄',
    predicate: (s) => s.consecutiveActiveMonths >= 3,
    progress: (s) => ({
      current: Math.min(s.consecutiveActiveMonths, 3),
      target: 3,
    }),
  },
];
