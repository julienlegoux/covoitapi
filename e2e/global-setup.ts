/**
 * Playwright global setup — runs before any test.
 * 1. Runs Prisma migrations against the test database
 * 2. Seeds the admin user
 */

import { execSync } from 'node:child_process';

const dbUrl =
	process.env.E2E_DATABASE_URL ||
	process.env.DATABASE_URL ||
	'postgresql://test:test@localhost:5433/covoitapi_test';

async function globalSetup() {
	// Run migrations against the test database
	console.log('Running Prisma migrations...');
	execSync('npx prisma migrate deploy', {
		stdio: 'inherit',
		env: { ...process.env, DATABASE_URL: dbUrl },
	});

	// Seed admin user
	console.log('Seeding admin user...');
	const { seedAdmin, disconnect } = await import('./helpers/db.js');
	await seedAdmin();
	await disconnect();
	console.log('Global setup complete.');
}

export default globalSetup;
