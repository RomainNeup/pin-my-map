import axios from "axios";
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { get } from "svelte/store";
import { accessToken } from "$lib/store/user";
import { setError } from "$lib/store/error";

export const axiosInstance = axios.create({
    baseURL: PUBLIC_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${get(accessToken)}`
    },
});

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            accessToken.update(() => null);
        }
        if (error.response && error.response.data && error.response.data.message) {
            setError(error.response.data.message);
            return Promise.reject({ error: error.response.data.message, status: error.response.status });
        }
        setError("An error occurred");
        console.error(error);
        return Promise.reject({error: "An error occurred", status: 500});
    }
);