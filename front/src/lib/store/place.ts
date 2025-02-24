import type { SavedPlace } from "$lib/api/savedPlace";
import { writable } from "svelte/store";

export const savedPlaces = writable<SavedPlace[]>([]);