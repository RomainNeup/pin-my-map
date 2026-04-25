import { axiosInstance } from './base';

export type RegistrationMode = 'open' | 'approval-required' | 'invite-only';

export interface AppConfig {
	registrationMode: RegistrationMode;
}

export function getConfig(): Promise<AppConfig> {
	return axiosInstance.get<AppConfig>('/config').then(({ data }) => data);
}

export function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
	return axiosInstance.put<AppConfig>('/config', partial).then(({ data }) => data);
}

export function getPublicConfig(): Promise<Pick<AppConfig, 'registrationMode'>> {
	return axiosInstance
		.get<Pick<AppConfig, 'registrationMode'>>('/config/public')
		.then(({ data }) => data);
}
