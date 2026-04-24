import { env } from '$env/dynamic/public';
import { styleForTheme } from '$lib/stores/mapStore';

export interface StaticMapOptions {
	lng: number;
	lat: number;
	zoom?: number;
	width?: number;
	height?: number;
	theme: 'light' | 'dark';
	pinColor?: string;
}

export function staticMapUrl({
	lng,
	lat,
	zoom = 14,
	width = 288,
	height = 256,
	theme,
	pinColor = 'ef4444'
}: StaticMapOptions): string {
	const style = styleForTheme(theme).replace('mapbox://styles/', '');
	const overlay = `pin-s+${pinColor}(${lng},${lat})`;
	const center = `${lng},${lat},${zoom},0`;
	const size = `${Math.round(width)}x${Math.round(height)}@2x`;
	const token = env.PUBLIC_MAPBOX_ACCESS_TOKEN;
	return `https://api.mapbox.com/styles/v1/${style}/static/${overlay}/${center}/${size}?access_token=${token}`;
}
