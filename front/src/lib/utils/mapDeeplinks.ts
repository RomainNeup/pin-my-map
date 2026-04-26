export interface DeeplinkTarget {
	name: string;
	lat: number;
	lng: number;
	/** Google Places place_id (e.g. from externalId when externalProvider === 'google'). */
	placeId?: string;
	/** Raw externalProvider value ('google' | 'mapbox' | 'osm' | …). */
	externalProvider?: string;
	/** googleMapsUri from enrichment — highest-priority; use verbatim when set. */
	googleMapsUri?: string;
	address?: string;
}

/**
 * Build the best possible Google Maps URL for a place.
 *
 * Priority:
 * 1. `googleMapsUri` from enrichment (real card URL, already resolved).
 * 2. `query_place_id` when provider is "google" (opens the exact place card).
 * 3. Name+address query (Google's heuristic — usually resolves to the card).
 * 4. Plain lat,lng fallback.
 */
export const googleMapsUrl = ({
	lat,
	lng,
	name,
	address,
	placeId,
	externalProvider,
	googleMapsUri
}: DeeplinkTarget): string => {
	if (googleMapsUri) return googleMapsUri;

	const base = 'https://www.google.com/maps/search/?api=1';
	const latLng = `${lat},${lng}`;

	if (externalProvider === 'google' && placeId) {
		const q = encodeURIComponent(latLng);
		return `${base}&query=${q}&query_place_id=${encodeURIComponent(placeId)}`;
	}

	if (name) {
		const queryText = address ? `${name}, ${address}` : `${name}, ${latLng}`;
		return `${base}&query=${encodeURIComponent(queryText)}`;
	}

	return `${base}&query=${encodeURIComponent(latLng)}`;
};

/**
 * Build an Apple Maps URL that opens the place card on iOS.
 * Uses `q` (name) + `ll` (coordinates) so Maps resolves to the right POI.
 */
export const appleMapsUrl = ({ lat, lng, name }: DeeplinkTarget): string => {
	const q = encodeURIComponent(name);
	return `https://maps.apple.com/?q=${q}&ll=${lat},${lng}`;
};

export const citymapperUrl = ({ lat, lng, name }: DeeplinkTarget): string => {
	const endcoord = `${lat},${lng}`;
	const endname = encodeURIComponent(name);
	return `https://citymapper.com/directions?endcoord=${endcoord}&endname=${endname}`;
};

export const wazeUrl = ({ lat, lng }: DeeplinkTarget): string => {
	return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
};

export type DeeplinkApp = 'google' | 'apple' | 'citymapper' | 'waze';

export const buildDeeplink = (app: DeeplinkApp, target: DeeplinkTarget): string => {
	switch (app) {
		case 'google':
			return googleMapsUrl(target);
		case 'apple':
			return appleMapsUrl(target);
		case 'citymapper':
			return citymapperUrl(target);
		case 'waze':
			return wazeUrl(target);
	}
};
