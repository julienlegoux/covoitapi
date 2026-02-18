/**
 * Playwright global teardown — runs after all tests complete.
 */

async function globalTeardown() {
	const { disconnect } = await import('./helpers/db.js');
	await disconnect();
	console.log('Global teardown complete.');
}

export default globalTeardown;
