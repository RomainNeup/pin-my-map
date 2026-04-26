import { ACHIEVEMENTS, UserStats } from './achievements.catalog';
import {
  computeNightOwlDays,
  computeConsecutiveActiveMonths,
  extractCountryFromAddress,
} from './gamification.service';

function makeStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    savedCount: 0,
    doneCount: 0,
    ratedCount: 0,
    fiveStarCount: 0,
    commentedCount: 0,
    tagsCreated: 0,
    uniqueTagsApplied: 0,
    placesCreated: 0,
    suggestionsSubmitted: 0,
    followingCount: 0,
    publicCommentsCount: 0,
    followerCount: 0,
    approvedSuggestionsCount: 0,
    countryCount: 0,
    nightOwlDays: 0,
    isPublicMapEnabled: false,
    accountAgeDays: 0,
    consecutiveActiveMonths: 0,
    ...overrides,
  };
}

function findAchievement(id: string) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) throw new Error(`Achievement "${id}" not found in catalog`);
  return a;
}

describe('Existing achievement IDs are preserved', () => {
  const originalIds = [
    'first_pin',
    'pinning_pro',
    'pin_legend',
    'done_and_dusted',
    'dedicated_traveler',
    'critic',
    'five_star_curator',
    'wordsmith',
    'tag_enthusiast',
    'tag_master',
    'pioneer',
    'cartographer',
    'social_butterfly',
    'community_voice',
    'helpful_neighbor',
  ];

  it.each(originalIds)('achievement "%s" still exists', (id) => {
    expect(ACHIEVEMENTS.find((a) => a.id === id)).toBeDefined();
  });
});

describe('New achievement predicates', () => {
  describe('globe_trotter', () => {
    const a = findAchievement('globe_trotter');

    it('unlocks when countryCount >= 5', () => {
      expect(a.predicate(makeStats({ countryCount: 5 }))).toBe(true);
      expect(a.predicate(makeStats({ countryCount: 10 }))).toBe(true);
    });

    it('does not unlock when countryCount < 5', () => {
      expect(a.predicate(makeStats({ countryCount: 4 }))).toBe(false);
      expect(a.predicate(makeStats({ countryCount: 0 }))).toBe(false);
    });

    it('progress caps at target=5', () => {
      expect(a.progress(makeStats({ countryCount: 8 }))).toEqual({
        current: 5,
        target: 5,
      });
    });
  });

  describe('night_owl', () => {
    const a = findAchievement('night_owl');

    it('unlocks when nightOwlDays >= 5', () => {
      expect(a.predicate(makeStats({ nightOwlDays: 5 }))).toBe(true);
    });

    it('does not unlock when nightOwlDays < 5', () => {
      expect(a.predicate(makeStats({ nightOwlDays: 4 }))).toBe(false);
    });
  });

  describe('completionist', () => {
    const a = findAchievement('completionist');

    it('unlocks when saved>=10 and 80% done', () => {
      expect(a.predicate(makeStats({ savedCount: 10, doneCount: 8 }))).toBe(
        true,
      );
      expect(a.predicate(makeStats({ savedCount: 10, doneCount: 10 }))).toBe(
        true,
      );
    });

    it('does not unlock when savedCount < 10 even if 100% done', () => {
      expect(a.predicate(makeStats({ savedCount: 5, doneCount: 5 }))).toBe(
        false,
      );
    });

    it('does not unlock when < 80% done with enough saved', () => {
      expect(a.predicate(makeStats({ savedCount: 10, doneCount: 7 }))).toBe(
        false,
      );
    });

    it('shows progress as count toward 10 when savedCount < 10', () => {
      const prog = a.progress(makeStats({ savedCount: 3, doneCount: 3 }));
      expect(prog).toEqual({ current: 3, target: 10 });
    });

    it('shows progress as completion percentage when savedCount >= 10', () => {
      const prog = a.progress(makeStats({ savedCount: 20, doneCount: 16 }));
      // 16/20 = 80%
      expect(prog).toEqual({ current: 80, target: 80 });
    });
  });

  describe('map_crafter', () => {
    const a = findAchievement('map_crafter');

    it('unlocks when isPublicMapEnabled is true', () => {
      expect(a.predicate(makeStats({ isPublicMapEnabled: true }))).toBe(true);
    });

    it('does not unlock when isPublicMapEnabled is false', () => {
      expect(a.predicate(makeStats({ isPublicMapEnabled: false }))).toBe(false);
    });
  });

  describe('popular_explorer', () => {
    const a = findAchievement('popular_explorer');

    it('unlocks when followingCount>=10 and followerCount>=5', () => {
      expect(
        a.predicate(makeStats({ followingCount: 10, followerCount: 5 })),
      ).toBe(true);
    });

    it('does not unlock when only followingCount is enough', () => {
      expect(
        a.predicate(makeStats({ followingCount: 10, followerCount: 4 })),
      ).toBe(false);
    });

    it('does not unlock when only followerCount is enough', () => {
      expect(
        a.predicate(makeStats({ followingCount: 9, followerCount: 5 })),
      ).toBe(false);
    });
  });

  describe('approved', () => {
    const a = findAchievement('approved');

    it('unlocks when approvedSuggestionsCount >= 5', () => {
      expect(a.predicate(makeStats({ approvedSuggestionsCount: 5 }))).toBe(
        true,
      );
    });

    it('does not unlock when approvedSuggestionsCount < 5', () => {
      expect(a.predicate(makeStats({ approvedSuggestionsCount: 4 }))).toBe(
        false,
      );
    });
  });

  describe('veteran', () => {
    const a = findAchievement('veteran');

    it('unlocks when accountAgeDays >= 365', () => {
      expect(a.predicate(makeStats({ accountAgeDays: 365 }))).toBe(true);
      expect(a.predicate(makeStats({ accountAgeDays: 400 }))).toBe(true);
    });

    it('does not unlock when accountAgeDays < 365', () => {
      expect(a.predicate(makeStats({ accountAgeDays: 364 }))).toBe(false);
    });
  });

  describe('comeback_kid', () => {
    const a = findAchievement('comeback_kid');

    it('unlocks when consecutiveActiveMonths >= 3', () => {
      expect(a.predicate(makeStats({ consecutiveActiveMonths: 3 }))).toBe(true);
    });

    it('does not unlock when consecutiveActiveMonths < 3', () => {
      expect(a.predicate(makeStats({ consecutiveActiveMonths: 2 }))).toBe(
        false,
      );
    });
  });

  describe('curator', () => {
    const a = findAchievement('curator');

    it('unlocks when tagsCreated >= 10', () => {
      expect(a.predicate(makeStats({ tagsCreated: 10 }))).toBe(true);
    });

    it('does not unlock when tagsCreated < 10', () => {
      expect(a.predicate(makeStats({ tagsCreated: 9 }))).toBe(false);
    });
  });

  describe('harsh_critic', () => {
    const a = findAchievement('harsh_critic');

    it('unlocks when ratedCount >= 25', () => {
      expect(a.predicate(makeStats({ ratedCount: 25 }))).toBe(true);
    });

    it('does not unlock when ratedCount < 25', () => {
      expect(a.predicate(makeStats({ ratedCount: 24 }))).toBe(false);
    });
  });
});

describe('extractCountryFromAddress', () => {
  it('returns the last comma-segment', () => {
    expect(
      extractCountryFromAddress('123 Main St, New York, United States'),
    ).toBe('United States');
  });

  it('handles single-segment address', () => {
    expect(extractCountryFromAddress('France')).toBe('France');
  });

  it('returns empty string for undefined', () => {
    expect(extractCountryFromAddress(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(extractCountryFromAddress('')).toBe('');
  });
});

describe('computeNightOwlDays', () => {
  const nightDate = (hour: number) => {
    const d = new Date('2025-01-15T00:00:00.000Z');
    d.setUTCHours(hour);
    return d;
  };

  it('counts a save at 22:00 UTC', () => {
    expect(computeNightOwlDays([nightDate(22)])).toBe(1);
  });

  it('counts a save at 03:00 UTC', () => {
    expect(computeNightOwlDays([nightDate(3)])).toBe(1);
  });

  it('does not count a save at 12:00 UTC', () => {
    expect(computeNightOwlDays([nightDate(12)])).toBe(0);
  });

  it('counts multiple nights as distinct days', () => {
    const d1 = new Date('2025-01-15T22:30:00.000Z');
    const d2 = new Date('2025-01-16T23:00:00.000Z');
    const d3 = new Date('2025-01-17T03:00:00.000Z');
    expect(computeNightOwlDays([d1, d2, d3])).toBe(3);
  });

  it('counts same-night saves only once', () => {
    const d1 = new Date('2025-01-15T22:00:00.000Z');
    const d2 = new Date('2025-01-15T23:30:00.000Z');
    expect(computeNightOwlDays([d1, d2])).toBe(1);
  });

  it('returns 0 for empty list', () => {
    expect(computeNightOwlDays([])).toBe(0);
  });
});

describe('computeConsecutiveActiveMonths', () => {
  const date = (yearMonth: string) => new Date(`${yearMonth}-15T12:00:00.000Z`);

  it('returns 0 for empty array', () => {
    expect(computeConsecutiveActiveMonths([])).toBe(0);
  });

  it('returns 1 for a single month', () => {
    expect(computeConsecutiveActiveMonths([date('2025-01')])).toBe(1);
  });

  it('returns streak length for consecutive months', () => {
    const dates = [date('2025-01'), date('2025-02'), date('2025-03')];
    expect(computeConsecutiveActiveMonths(dates)).toBe(3);
  });

  it('ignores gaps between non-consecutive months', () => {
    const dates = [date('2025-01'), date('2025-03')];
    expect(computeConsecutiveActiveMonths(dates)).toBe(1);
  });

  it('returns the longest streak when multiple runs exist', () => {
    const dates = [
      date('2025-01'),
      date('2025-02'), // streak=2
      date('2025-05'),
      date('2025-06'),
      date('2025-07'), // streak=3
    ];
    expect(computeConsecutiveActiveMonths(dates)).toBe(3);
  });

  it('counts each month only once even with multiple saves', () => {
    const dates = [
      date('2025-01'),
      date('2025-01'), // same month twice
      date('2025-02'),
      date('2025-03'),
    ];
    expect(computeConsecutiveActiveMonths(dates)).toBe(3);
  });
});
