import axios from "axios";
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { get } from "svelte/store";
import { accessToken } from "$lib/store/user";

export const axiosInstance = axios.create({
    baseURL: PUBLIC_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${get(accessToken)}`
    },
});
