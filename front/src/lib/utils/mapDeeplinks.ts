export interface DeeplinkTarget {
	name: string;
	lat: number;
	lng: number;
	placeId?: string;
}

export const googleMapsUrl = ({ lat, lng, placeId }: DeeplinkTarget): string => {
	const q = encodeURIComponent(`${lat},${lng}`);
	const pid = encodeURIComponent(placeId ?? '');
	return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${pid}`;
};

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
