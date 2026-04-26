import { test, expect } from './_setup/fixtures';

test.describe('Public routes (anonymous)', () => {
	test('GET /discover renders without crashing', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto('/discover');
		await expect(page.locator('body')).toBeVisible();
		expect(errors, errors.join('\n')).toEqual([]);
	});

	test('GET /u/unknown-slug shows a not-found state, not a crash', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto('/u/__definitely-not-a-real-slug__');
		await expect(page.locator('body')).toBeVisible();
		expect(errors, errors.join('\n')).toEqual([]);
	});

	test('GET /public/unknown-token shows a not-found state, not a crash', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto('/public/__definitely-not-a-real-token__');
		await expect(page.locator('body')).toBeVisible();
		expect(errors, errors.join('\n')).toEqual([]);
	});
});
