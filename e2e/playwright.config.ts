import { defineConfig } from '@playwright/test';

const port = Number(process.env.E2E_PORT) || 3333;

export default defineConfig({
	testDir: './tests',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI
		? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
		: [['list'], ['html', { open: 'on-failure', outputFolder: 'playwright-report' }]],
	globalSetup: './global-setup.ts',
	globalTeardown: './global-teardown.ts',
	use: {
		baseURL: `http://localhost:${port}`,
		extraHTTPHeaders: {
			'Content-Type': 'application/json',
		},
	},
	webServer: {
		command: `tsx server.ts`,
		port,
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
	},
	projects: [
		{
			name: 'v1-api',
			testDir: './tests/v1',
		},
		{
			name: 'vp-api',
			testDir: './tests/vp',
			dependencies: ['v1-api'],
		},
	],
});
