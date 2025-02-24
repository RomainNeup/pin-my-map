import { writable } from "svelte/store";

export const error = writable<string[]>([]);

export const setError = (message: string) => {
    error.update((errors) => {
        return [...errors, message];
    });
    setTimeout(() => {
        error.update((errors) => {
            return errors.slice(1);
        });
    }, 5000);
}

export const clearErrors = () => {
    error.set([]);
}

export const clearError = (index: number) => {
    error.update((errors) => {
        return errors.filter((_, i) => i !== index);
    });
}