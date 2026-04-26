import { test, expect } from './_setup/fixtures';

test.describe('Saved places', () => {
	test('authenticated user reaches /saved/list', async ({ page, seedUser }) => {
		const user = await seedUser();
		await page.addInitScript(
			`window.localStorage.setItem('accessToken', ${JSON.stringify(user.accessToken)});`
		);
		await page.goto('/saved/list');
		await expect(page.locator('body')).toBeVisible();
		// Either an empty-state or a list container should be visible.
		const surface = page
			.locator('[data-testid="saved-list"]')
			.or(page.getByText(/no (saved )?places|empty|nothing/i))
			.or(page.getByRole('list'));
		await expect(surface.first()).toBeVisible({ timeout: 10_000 });
	});

	test('anonymous visitor is redirected from /saved/list', async ({ page }) => {
		await page.goto('/saved/list');
		await page.waitForTimeout(1500);
		// Should not stay on /saved/list without a session.
		expect(page.url()).not.toMatch(/\/saved\/list$/);
	});
});
