import { test, expect } from './_setup/fixtures';

test.describe('Authentication', () => {
	test('register → login → logout', async ({ page, request }) => {
		const email = `pw_${Date.now()}@example.test`;
		const password = 'Password123!';

		await page.goto('/register');
		await page.getByLabel(/name/i).fill('Playwright User');
		await page.getByLabel(/email/i).fill(email);
		await page.getByLabel('Password', { exact: true }).fill(password);
		const confirm = page.getByLabel(/confirm password/i);
		if (await confirm.count()) await confirm.first().fill(password);
		await page.getByRole('button', { name: /register|sign up|create account/i }).click();

		// Either auto-login (lands on /) or redirects to /login.
		await page.waitForURL((url) => /\/(login)?$/.test(url.pathname), { timeout: 10_000 });

		if (page.url().includes('/login')) {
			await page.getByLabel(/email/i).fill(email);
			await page.getByLabel(/password/i).fill(password);
			await page.getByRole('button', { name: /log ?in|sign in/i }).click();
			await page.waitForURL('**/');
		}

		// Verify session via API.
		const token = await page.evaluate(() => localStorage.getItem('accessToken'));
		expect(token).toBeTruthy();
		const me = await request.get('http://localhost:8089/auth/me', {
			headers: { Authorization: `Bearer ${token}` }
		});
		expect(me.status()).toBe(200);
	});

	test('login with invalid credentials shows error toast', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel(/email/i).fill('nope@example.test');
		await page.getByLabel(/password/i).fill('wrongpassword');
		await page.getByRole('button', { name: /log ?in|sign in/i }).click();

		// Expect to remain on /login and to see some error indicator (toast or inline).
		await expect(page).toHaveURL(/\/login/);
		const errorIndicator = page
			.getByRole('alert')
			.or(page.locator('[data-testid="toast-error"]'))
			.or(page.getByText(/invalid|incorrect|unauthorized|wrong/i));
		await expect(errorIndicator.first()).toBeVisible({ timeout: 5_000 });
	});

	test('forgot-password page submits without crashing', async ({ page }) => {
		const res = await page.goto('/forgot-password');
		// Page should load (could be 200 or fall through to / if not configured).
		expect(res?.status()).toBeLessThan(500);
		const emailField = page.getByLabel(/email/i);
		if (await emailField.count()) {
			await emailField.first().fill('any@example.test');
			const submit = page.getByRole('button', { name: /send|submit|reset/i });
			if (await submit.count()) await submit.first().click();
		}
	});
});
