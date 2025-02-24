import { accessToken } from "$lib/store/user";
import { axiosInstance } from "./base";

export function login(email: string, password: string) {
    return axiosInstance.post('/auth/login', { email, password })
        .then((response) => {
            const token = response.data.accessToken;

            accessToken.set(token);

            return response;
        });
}

export function register(name: string, email: string, password: string) {
    return axiosInstance.post('/auth/register', { name, email, password });
}