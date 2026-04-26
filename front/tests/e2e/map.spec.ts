import { test, expect } from './_setup/fixtures';

test.describe('Map (home)', () => {
	test('anonymous user lands on / without crashing', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto('/');
		// SPA renders client-side; wait for any visible body content.
		await expect(page.locator('body')).toBeVisible();
		expect(errors, errors.join('\n')).toEqual([]);
	});

	test('authenticated user sees the map shell', async ({ page, context, seedUser }) => {
		const user = await seedUser();
		await context.grantPermissions(['geolocation']);
		await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
		await page.addInitScript(
			`window.localStorage.setItem('accessToken', ${JSON.stringify(user.accessToken)});`
		);
		await page.goto('/');
		await expect(page.locator('body')).toBeVisible();
		// Mapbox container or any nav primitive should be present.
		const ready = page
			.locator('[data-testid="map-container"]')
			.or(page.locator('.mapboxgl-map'))
			.or(page.getByRole('navigation'));
		await expect(ready.first()).toBeVisible({ timeout: 10_000 });
	});
});
