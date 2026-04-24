import { axiosInstance } from './base';

export interface ImportError {
	index: number;
	name?: string;
	message: string;
}

export interface ImportSummary {
	imported: number;
	skipped: number;
	failed: number;
	errors: ImportError[];
}

export function importMapstr(file: File): Promise<ImportSummary> {
	const formData = new FormData();
	formData.append('file', file);
	return axiosInstance
		.post<ImportSummary>('/import/mapstr', formData, {
			headers: { 'Content-Type': 'multipart/form-data' }
		})
		.then(({ data }) => data);
}
