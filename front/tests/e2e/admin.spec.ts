import { test, expect } from './_setup/fixtures';

test.describe('Admin pages gating', () => {
	test('non-admin user is redirected/denied from /admin/users', async ({ page, seedUser }) => {
		const user = await seedUser();
		await page.addInitScript(
			`window.localStorage.setItem('accessToken', ${JSON.stringify(user.accessToken)});`
		);
		await page.goto('/admin/users');
		// Either redirected away from /admin or shown a forbidden state.
		await page.waitForTimeout(1500);
		const url = new URL(page.url());
		const denied =
			!url.pathname.startsWith('/admin') ||
			(await page.getByText(/forbidden|not authori[sz]ed|admin only/i).count()) > 0;
		expect(denied).toBeTruthy();
	});

	test('anonymous visitor cannot reach /admin/audit', async ({ page }) => {
		await page.goto('/admin/audit');
		await page.waitForTimeout(1500);
		const url = new URL(page.url());
		expect(url.pathname.startsWith('/admin')).toBeFalsy();
	});
});
