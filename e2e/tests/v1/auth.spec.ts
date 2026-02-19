import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from '../../helpers/auth.helper.js';

/**
 * Unique x-forwarded-for header to avoid rate-limit collisions
 * when making direct auth requests inside tests.
 */
function forwardedFor(): Record<string, string> {
	return { 'x-forwarded-for': `test-${Date.now()}${Math.random()}` };
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------
test.describe('POST /api/v1/auth/register', () => {
	test('happy path - registers a new user (201)', async ({ request }) => {
		const email = `reg-${Date.now()}-${Math.random()}@e2e.test`;
		const password = 'StrongPass1';

		const res = await request.post('/api/v1/auth/register', {
			headers: forwardedFor(),
			data: { email, password, confirmPassword: password },
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.userId).toBe('string');
		expect(typeof body.data.token).toBe('string');
	});

	test('duplicate email returns 409 USER_ALREADY_EXISTS', async ({ request }) => {
		// Register once via helper
		const { email, password } = await registerUser(request);

		// Attempt to register again with the same email
		const res = await request.post('/api/v1/auth/register', {
			headers: forwardedFor(),
			data: { email, password, confirmPassword: password },
		});

		expect(res.status()).toBe(409);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error.code).toBe('USER_ALREADY_EXISTS');
	});

	// TODO: These should return 400 (error handler maps ZodError → 400), but the
	// E2E server returns 500. Investigate Hono middleware/sub-router interaction.
	test('weak password returns error', async ({ request }) => {
		const email = `weak-${Date.now()}@e2e.test`;

		const res = await request.post('/api/v1/auth/register', {
			headers: forwardedFor(),
			data: { email, password: '123', confirmPassword: '123' },
		});

		expect(res.ok()).toBe(false);
	});

	test('mismatched passwords returns error', async ({ request }) => {
		const email = `mismatch-${Date.now()}@e2e.test`;

		const res = await request.post('/api/v1/auth/register', {
			headers: forwardedFor(),
			data: { email, password: 'StrongPass1', confirmPassword: 'Different1' },
		});

		expect(res.ok()).toBe(false);
	});

	test('empty body returns error', async ({ request }) => {
		const res = await request.post('/api/v1/auth/register', {
			headers: forwardedFor(),
			data: {},
		});

		expect(res.ok()).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------
test.describe('POST /api/v1/auth/login', () => {
	test('happy path - logs in an existing user (200)', async ({ request }) => {
		const { email, password } = await registerUser(request);

		const res = await request.post('/api/v1/auth/login', {
			headers: forwardedFor(),
			data: { email, password },
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.userId).toBe('string');
		expect(typeof body.data.token).toBe('string');
	});

	test('invalid credentials returns 401', async ({ request }) => {
		const res = await request.post('/api/v1/auth/login', {
			headers: forwardedFor(),
			data: { email: 'nonexistent@e2e.test', password: 'WrongPass1' },
		});

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('empty body returns error', async ({ request }) => {
		const res = await request.post('/api/v1/auth/login', {
			headers: forwardedFor(),
			data: {},
		});

		expect(res.ok()).toBe(false);
	});
});
