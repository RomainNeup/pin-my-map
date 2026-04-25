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

export interface RowError {
	row: number;
	message: string;
}

export interface GoogleImportSummary {
	placesCreated: number;
	savedCreated: number;
	skipped: number;
	errors: RowError[];
}

export interface CsvImportSummary {
	created: number;
	skipped: number;
	errors: RowError[];
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

export function importGoogle(file: File): Promise<GoogleImportSummary> {
	const formData = new FormData();
	formData.append('file', file);
	return axiosInstance
		.post<GoogleImportSummary>('/import/google', formData, {
			headers: { 'Content-Type': 'multipart/form-data' }
		})
		.then(({ data }) => data);
}

export function importPlacesCsv(file: File): Promise<CsvImportSummary> {
	const formData = new FormData();
	formData.append('file', file);
	return axiosInstance
		.post<CsvImportSummary>('/import/places-csv', formData, {
			headers: { 'Content-Type': 'multipart/form-data' }
		})
		.then(({ data }) => data);
}
