import * as mapbox from 'mapbox-gl';
import { writable } from 'svelte/store';
import { env } from '$env/dynamic/public';

export interface MapState {
  map: mapbox.Map | null;
  isLoaded: boolean;
}

// Create a writable store with initial state
const createMapStore = () => {
  const { subscribe, set, update } = writable<MapState>({
    map: null,
    isLoaded: false
  });

  return {
    subscribe,

    // Initialize map instance
    init: (container: HTMLDivElement | string, options: Partial<mapbox.MapOptions> = {}) => {
      const map = new mapbox.Map({
        container,
        accessToken: env.PUBLIC_MAPBOX_ACCESS_TOKEN,
        style: 'mapbox://styles/mapbox/outdoors-v11',
        attributionControl: false,
        ...options
      });

      map.on('load', () => {
        update(state => ({ ...state, isLoaded: true }));
      });

      set({ map, isLoaded: false });
      return map;
    },

    // Clean up map instance
    destroy: () => {
      update(state => {
        if (state.map) {
          state.map.remove();
        }
        return { map: null, isLoaded: false };
      });
    }
  };
};

export const mapStore = createMapStore();
