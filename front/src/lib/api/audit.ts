import { axiosInstance } from './base';

export interface AuditLog {
	id: string;
	actorId: string;
	actorName?: string;
	actorEmail?: string;
	action: string;
	targetType: string;
	targetId?: string;
	before?: Record<string, unknown>;
	after?: Record<string, unknown>;
	meta?: Record<string, unknown>;
	createdAt: string;
}

export interface AuditFilters {
	action?: string;
	targetType?: string;
	actor?: string;
	limit?: number;
}

export function listAudit(filters: AuditFilters = {}): Promise<AuditLog[]> {
	const params = new URLSearchParams();
	if (filters.action) params.set('action', filters.action);
	if (filters.targetType) params.set('targetType', filters.targetType);
	if (filters.actor) params.set('actor', filters.actor);
	if (filters.limit) params.set('limit', String(filters.limit));
	const qs = params.toString();
	return axiosInstance.get<AuditLog[]>(`/audit${qs ? `?${qs}` : ''}`).then(({ data }) => data);
}
