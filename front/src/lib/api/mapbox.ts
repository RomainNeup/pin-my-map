import { env } from '$env/dynamic/public';

export interface GeocodeResult {
	address: string;
	placeName?: string;
}

export async function reverseGeocode(lng: number, lat: number): Promise<GeocodeResult> {
	const token = env.PUBLIC_MAPBOX_ACCESS_TOKEN;
	const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi,place&limit=1`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
	const data = await res.json();
	const feature = data.features?.[0];
	return {
		address: feature?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
		placeName: feature?.text
	};
}
