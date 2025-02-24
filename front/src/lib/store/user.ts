import { browser } from "$app/environment";
import { writable } from "svelte/store";

let accessTokenFromStorage = null;
let userLocationFromStorage = null;

if (browser) {
    accessTokenFromStorage = localStorage.getItem("accessToken");
    var userLocationString = localStorage.getItem("userLocation");
    if (userLocationString) {
        userLocationFromStorage = JSON.parse(userLocationString);
    }
}

export const accessToken = writable<string | null>(accessTokenFromStorage);
export const userLocation = writable<GeolocationPosition | null>(userLocationFromStorage);

if (browser) {
    accessToken.subscribe(value => {
        if (!browser) return;
        if (value === null) localStorage.removeItem("accessToken");
        else localStorage.setItem("accessToken", value);
    });

    userLocation.subscribe(value => {
        if (!browser) return;
        if (value === null) localStorage.removeItem("userLocation");
        else localStorage.setItem("userLocation", JSON.stringify(value));
    });
}
