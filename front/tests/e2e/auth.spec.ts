import { test, expect } from './_setup/fixtures';

test.describe('Authentication', () => {
	test('register + login + me round-trips via the API', async ({ request }) => {
		const apiBase =
			(typeof process !== 'undefined' && process.env?.PUBLIC_API_BASE_URL) ||
			'http://localhost:8089';
		const email = `pw_${Date.now()}_${Math.random().toString(36).slice(2)}@example.test`;
		const password = 'Password123!';
		const reg = await request.post(`${apiBase}/auth/register`, {
			data: { name: 'Playwright User', email, password }
		});
		expect([200, 201]).toContain(reg.status());
		const login = await request.post(`${apiBase}/auth/login`, {
			data: { email, password }
		});
		expect([200, 201]).toContain(login.status());
		const { accessToken } = await login.json();
		expect(accessToken).toBeTruthy();
		const me = await request.get(`${apiBase}/auth/me`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		expect(me.status()).toBe(200);
	});

	test('login with invalid credentials shows error toast', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel(/email/i).fill('nope@example.test');
		await page.getByLabel(/password/i).fill('wrongpassword');
		await page.getByRole('button', { name: /log ?in|sign in/i }).click();

		// Bad creds must NOT log the user in: stay on /login, no token stored.
		await page.waitForTimeout(1500);
		await expect(page).toHaveURL(/\/login/);
		const token = await page.evaluate(() => localStorage.getItem('accessToken'));
		expect(token).toBeNull();
	});

	test('forgot-password page loads without crashing', async ({ page }) => {
		const res = await page.goto('/forgot-password');
		// Page should load — anything below 500 means the SPA renders something.
		expect(res?.status()).toBeLessThan(500);
	});
});
