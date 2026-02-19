import { test, expect } from '@playwright/test';
import { registerUser } from '../../helpers/auth.helper.js';

/**
 * Unique x-forwarded-for header to avoid rate-limit collisions
 * when making direct auth requests inside tests.
 */
function forwardedFor(): Record<string, string> {
	return { 'x-forwarded-for': `test-${Date.now()}-${Math.random()}` };
}

// ---------------------------------------------------------------------------
// POST /api/vp/register
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/register', () => {
	test('happy path - registers a new user (201)', async ({ request }) => {
		const email = `vp-reg-${Date.now()}-${Math.random()}@e2e.test`;
		const password = 'StrongPass1';

		const res = await request.post('/api/vp/register', {
			headers: forwardedFor(),
			data: { email, password },
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.userId).toBe('string');
		expect(typeof body.data.token).toBe('string');
	});

	test('duplicate email returns 409', async ({ request }) => {
		// Register once via the V1 helper (same auth store)
		const { email, password } = await registerUser(request);

		// Attempt to register again with the same email via VP
		const res = await request.post('/api/vp/register', {
			headers: forwardedFor(),
			data: { email, password },
		});

		expect(res.status()).toBe(409);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('weak password returns 500 (unhandled ZodError)', async ({ request }) => {
		const email = `vp-weak-${Date.now()}@e2e.test`;

		const res = await request.post('/api/vp/register', {
			headers: forwardedFor(),
			data: { email, password: '123' },
		});

		expect(res.status()).toBe(500);
	});

	test('empty body returns 500 (unhandled ZodError)', async ({ request }) => {
		const res = await request.post('/api/vp/register', {
			headers: forwardedFor(),
			data: {},
		});

		expect(res.status()).toBe(500);
	});
});

// ---------------------------------------------------------------------------
// POST /api/vp/login
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/login', () => {
	test('happy path - logs in an existing user (200)', async ({ request }) => {
		const { email, password } = await registerUser(request);

		const res = await request.post('/api/vp/login', {
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
		const res = await request.post('/api/vp/login', {
			headers: forwardedFor(),
			data: { email: 'nonexistent-vp@e2e.test', password: 'WrongPass1' },
		});

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('empty body returns 500 (unhandled ZodError)', async ({ request }) => {
		const res = await request.post('/api/vp/login', {
			headers: forwardedFor(),
			data: {},
		});

		expect(res.status()).toBe(500);
	});
});
