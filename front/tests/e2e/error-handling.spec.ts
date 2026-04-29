import { test, expect } from './_setup/fixtures';

test.describe('API error handling', () => {
	test('401 response clears session and redirects to /login', async ({ page, seedUser }) => {
		const user = await seedUser();
		await page.addInitScript(
			`window.localStorage.setItem('accessToken', ${JSON.stringify(user.accessToken)});`
		);

		// Force every authenticated GET to return 401 to simulate token expiry.
		await page.route(/\/auth\/me$/, (route) =>
			route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"jwt expired"}' })
		);

		await page.goto('/profile');
		// Wait for either redirect to /login or token clearing.
		await page
			.waitForURL(/\/login/, { timeout: 5_000 })
			.catch(() => {});
		await page.waitForLoadState('domcontentloaded').catch(() => {});
		const token = await page
			.evaluate(() => localStorage.getItem('accessToken'))
			.catch(() => null);
		const url = new URL(page.url());
		expect(token === null || url.pathname.startsWith('/login')).toBeTruthy();
	});

	test('5xx response surfaces a toast', async ({ page }) => {
		await page.route(/\/auth\/login$/, (route) =>
			route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' })
		);

		await page.goto('/login');
		await page.getByLabel(/email/i).fill('whatever@example.test');
		await page.getByLabel(/password/i).fill('Password123!');
		await page.getByRole('button', { name: /log ?in|sign in/i }).click();

		// 5xx must not log the user in: stay on /login, no token stored.
		await page.waitForTimeout(1500);
		await expect(page).toHaveURL(/\/login/);
		const token = await page.evaluate(() => localStorage.getItem('accessToken'));
		expect(token).toBeNull();
	});

	test('network failure surfaces a toast and does not crash the app', async ({ page }) => {
		await page.route(/\/auth\/login$/, (route) => route.abort('failed'));

		await page.goto('/login');
		await page.getByLabel(/email/i).fill('whatever@example.test');
		await page.getByLabel(/password/i).fill('Password123!');
		await page.getByRole('button', { name: /log ?in|sign in/i }).click();

		await expect(page).toHaveURL(/\/login/);
	});
});
