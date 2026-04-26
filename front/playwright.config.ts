import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

const baseProjects = [
	{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }
];
const ciProjects = [
	{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
	{ name: 'webkit', use: { ...devices['Desktop Safari'] } }
];

export default defineConfig({
	testDir: './tests/e2e',
	testIgnore: ['**/_setup/**'],
	fullyParallel: false,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 2 : 1,
	reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	use: {
		baseURL: 'http://localhost:5174',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: isCI ? ciProjects : baseProjects,
	webServer: [
		{
			command: 'node ./tests/e2e/_setup/run-backend.mjs',
			// /auth/me returns 401 unauthenticated — proves the server is up.
			url: 'http://localhost:8089/auth/me',
			reuseExistingServer: false,
			timeout: 120_000,
			stdout: 'pipe',
			stderr: 'pipe',
			env: {
				NODE_ENV: 'test',
				JWT_SECRET: 'test-secret',
				PORT: '8089',
				CORS_ALLOWED_ORIGINS: 'http://localhost:5174'
			}
		},
		{
			command: 'yarn start:dev --host 127.0.0.1 --port 5174',
			url: 'http://localhost:5174',
			reuseExistingServer: false,
			timeout: 120_000,
			stdout: 'pipe',
			stderr: 'pipe',
			env: {
				PUBLIC_API_BASE_URL: 'http://localhost:8089',
				PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.test'
			}
		}
	]
});
