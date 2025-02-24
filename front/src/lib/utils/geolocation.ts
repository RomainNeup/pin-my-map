import { userLocation } from "$lib/store/user";

export class CustomGeolocation implements Geolocation {

    private savePosition(position: GeolocationPosition) {
        userLocation.set(position);
    }

    public getCurrentPosition(successCallback: PositionCallback, errorCallback?: PositionErrorCallback, options?: PositionOptions) {
        userLocation.subscribe((value) => {
            if (value !== null) {
                successCallback(value);
            }
        });

        navigator.geolocation.getCurrentPosition(this.savePosition, errorCallback, options);
    }

    public watchPosition(successCallback: PositionCallback, errorCallback: PositionErrorCallback, options: PositionOptions) {
        return navigator.geolocation.watchPosition((position) => {
            this.savePosition(position);
            successCallback(position);
        }, errorCallback, options);
    }

    public clearWatch(watchId: number) {
        navigator.geolocation.clearWatch(watchId);
    }

}