import { get } from 'svelte/store';
import { userLocation } from '$lib/stores/user';

export class CustomGeolocation implements Geolocation {
	private savePosition = (position: GeolocationPosition) => {
		userLocation.set(position);
	};

	public getCurrentPosition(
		successCallback: PositionCallback,
		errorCallback?: PositionErrorCallback,
		options?: PositionOptions
	) {
		const cached = get(userLocation);
		if (cached !== null) {
			successCallback(cached);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.savePosition(position);
				successCallback(position);
			},
			errorCallback,
			options
		);
	}

	public watchPosition(
		successCallback: PositionCallback,
		errorCallback: PositionErrorCallback,
		options: PositionOptions
	) {
		return navigator.geolocation.watchPosition(
			(position) => {
				this.savePosition(position);
				successCallback(position);
			},
			errorCallback,
			options
		);
	}

	public clearWatch(watchId: number) {
		navigator.geolocation.clearWatch(watchId);
	}
}
