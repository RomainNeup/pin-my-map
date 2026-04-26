import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';

/** A 1×1 transparent PNG (base64). */
const TRANSPARENT_PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const API_BASE = process.env.PUBLIC_API_BASE_URL || 'http://localhost:8089';

export interface SeedUser {
	id?: string;
	name: string;
	email: string;
	password: string;
	role?: 'user' | 'admin';
	accessToken?: string;
}

let userCounter = 0;
function uniqueEmail(prefix = 'user'): string {
	userCounter += 1;
	return `${prefix}+${Date.now()}_${userCounter}@example.test`;
}

export async function registerUser(
	request: { post: (url: string, opts?: any) => Promise<any> },
	overrides: Partial<SeedUser> = {}
): Promise<SeedUser> {
	const user: SeedUser = {
		name: overrides.name ?? `Test User ${userCounter + 1}`,
		email: overrides.email ?? uniqueEmail('user'),
		password: overrides.password ?? 'Password123!',
		role: overrides.role ?? 'user'
	};
	const res = await request.post(`${API_BASE}/auth/register`, {
		data: { name: user.name, email: user.email, password: user.password }
	});
	if (![200, 201].includes(res.status())) {
		throw new Error(`register failed: ${res.status()} ${await res.text()}`);
	}
	const login = await request.post(`${API_BASE}/auth/login`, {
		data: { email: user.email, password: user.password }
	});
	if (![200, 201].includes(login.status())) {
		throw new Error(`login failed: ${login.status()} ${await login.text()}`);
	}
	const body = await login.json();
	user.accessToken = body.accessToken;
	return user;
}

/**
 * Stubs Mapbox tile + API requests so tests don't hit the network and don't
 * depend on a real token.
 */
export async function mockMapbox(context: BrowserContext): Promise<void> {
	await context.route(/api\.mapbox\.com|tiles\.mapbox\.com|events\.mapbox\.com/, (route) => {
		const url = route.request().url();
		if (url.endsWith('.png') || url.includes('/tiles/')) {
			return route.fulfill({
				status: 200,
				contentType: 'image/png',
				body: TRANSPARENT_PNG_BASE64,
				// Playwright's `body` accepts string|Buffer; the route handler decodes from base64
				// when contentType is binary, but to be safe we set headers + use bodyEncoded.
				headers: { 'Content-Type': 'image/png' }
			});
		}
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ features: [], type: 'FeatureCollection' })
		});
	});
}

export async function loginAs(page: Page, user: SeedUser): Promise<void> {
	if (!user.accessToken) {
		throw new Error('user has no accessToken — seed via registerUser first');
	}
	await page.addInitScript(`window.localStorage.setItem('accessToken', ${JSON.stringify(user.accessToken)});`);
}

type Fixtures = {
	mockedMaps: void;
	seedUser: (overrides?: Partial<SeedUser>) => Promise<SeedUser>;
};

export const test = base.extend<Fixtures>({
	mockedMaps: [
		async ({ context }, use) => {
			await mockMapbox(context);
			await use();
		},
		{ auto: true }
	],
	seedUser: async ({ request }, use) => {
		// First user in a fresh DB becomes admin. Burn one bootstrap user
		// (best-effort — duplicate burns just no-op as 400 user-exists).
		await registerUser(request, {
			name: 'Bootstrap Admin',
			email: 'bootstrap-admin@example.test'
		}).catch(() => {});
		await use((overrides = {}) => registerUser(request, overrides));
	}
});

export { expect };
