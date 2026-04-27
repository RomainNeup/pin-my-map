import { test, expect } from './_setup/fixtures';

test.describe('Admin pages gating', () => {
	test('non-admin user is denied admin endpoints by the API', async ({ request, seedUser }) => {
		const user = await seedUser();
		// The contract that actually matters: backend rejects admin endpoints
		// for non-admin tokens. UI gating may render a page shell either way.
		const apiBase =
			(typeof process !== 'undefined' && process.env?.PUBLIC_API_BASE_URL) ||
			'http://localhost:8089';
		const res = await request.get(`${apiBase}/audit`, {
			headers: { Authorization: `Bearer ${user.accessToken}` }
		});
		expect(res.status()).toBe(403);
	});

	test('anonymous visitor cannot reach /admin/audit', async ({ page }) => {
		await page.goto('/admin/audit');
		await page.waitForTimeout(1500);
		const url = new URL(page.url());
		expect(url.pathname.startsWith('/admin')).toBeFalsy();
	});
});
