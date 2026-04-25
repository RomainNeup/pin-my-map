export function styleForTheme(resolved: 'light' | 'dark'): string {
	return resolved === 'dark'
		? 'mapbox://styles/mapbox/dark-v11'
		: 'mapbox://styles/mapbox/streets-v12';
}
