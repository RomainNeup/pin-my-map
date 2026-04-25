import { writable } from 'svelte/store';
import {
	getGamificationProfile,
	type GamificationProfile,
	type Achievement
} from '$lib/api/gamification';
import { toast } from '$lib/stores/toast';

export const gamificationProfile = writable<GamificationProfile | null>(null);

let lastUnlockedIds = new Set<string>();
let inFlight: Promise<void> | null = null;

export async function loadGamificationProfile(opts: { silent?: boolean } = {}): Promise<void> {
	if (inFlight) return inFlight;
	inFlight = (async () => {
		try {
			const profile = await getGamificationProfile();
			const previous = lastUnlockedIds;
			const currentlyUnlocked = new Set(
				profile.achievements.filter((a) => a.unlocked).map((a) => a.id)
			);

			if (!opts.silent && previous.size > 0) {
				const newlyUnlocked: Achievement[] = profile.achievements.filter(
					(a) => a.unlocked && !previous.has(a.id)
				);
				for (const ach of newlyUnlocked) {
					toast(`${ach.icon} Achievement unlocked: ${ach.name}`, 'success', { duration: 5000 });
				}
			}

			lastUnlockedIds = currentlyUnlocked;
			gamificationProfile.set(profile);
		} finally {
			inFlight = null;
		}
	})();
	return inFlight;
}

export function resetGamification(): void {
	lastUnlockedIds = new Set();
	gamificationProfile.set(null);
}
