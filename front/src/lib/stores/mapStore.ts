import * as mapbox from 'mapbox-gl';
import { writable, get } from 'svelte/store';
import { env } from '$env/dynamic/public';
import { theme } from './theme';

export interface MapState {
	map: mapbox.Map | null;
	isLoaded: boolean;
}

export function styleForTheme(resolved: 'light' | 'dark'): string {
	return resolved === 'dark'
		? 'mapbox://styles/mapbox/dark-v11'
		: 'mapbox://styles/mapbox/streets-v12';
}

const createMapStore = () => {
	const { subscribe, set, update } = writable<MapState>({
		map: null,
		isLoaded: false
	});

	let themeUnsub: (() => void) | null = null;

	return {
		subscribe,

		init(container: HTMLDivElement | string, options: Partial<mapbox.MapOptions> = {}) {
			const resolved = theme.resolved();
			const map = new mapbox.Map({
				container,
				accessToken: env.PUBLIC_MAPBOX_ACCESS_TOKEN,
				style: styleForTheme(resolved),
				attributionControl: false,
				...options
			});

			map.on('load', () => {
				update((state) => ({ ...state, isLoaded: true }));
			});

			// Subscribe to theme changes and swap style (skip initial synchronous fire)
			let firstFire = true;
			themeUnsub = theme.subscribe(() => {
				if (firstFire) {
					firstFire = false;
					return;
				}
				if (!map.isStyleLoaded()) return;
				const r = theme.resolved();
				const current = map.getStyle()?.sprite ?? '';
				const wantsDark = r === 'dark';
				if (wantsDark !== current.includes('dark')) {
					map.setStyle(styleForTheme(r));
				}
			});

			set({ map, isLoaded: false });
			return map;
		},

		destroy() {
			if (themeUnsub) {
				themeUnsub();
				themeUnsub = null;
			}
			update((state) => {
				if (state.map) state.map.remove();
				return { map: null, isLoaded: false };
			});
		},

		get() {
			return get({ subscribe }).map;
		}
	};
};

export const mapStore = createMapStore();
