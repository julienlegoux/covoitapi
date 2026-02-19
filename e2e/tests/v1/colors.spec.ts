import { test, expect } from '@playwright/test';
import {
	registerUser,
	createDriverAccount,
	loginAdmin,
	authHeader,
} from '../../helpers/auth.helper.js';
import { colorPayload } from '../../helpers/test-data.js';

// ---------------------------------------------------------------------------
// GET /api/v1/colors
// ---------------------------------------------------------------------------
test.describe('GET /api/v1/colors', () => {
	test('DRIVER role returns 200', async ({ request }) => {
		const { token } = await createDriverAccount(request);

		const res = await request.get('/api/v1/colors', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data.data)).toBe(true);
		expect(body.data.meta).toBeDefined();
	});

	test('USER role returns 403', async ({ request }) => {
		const { token } = await registerUser(request);

		const res = await request.get('/api/v1/colors', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// POST /api/v1/colors
// ---------------------------------------------------------------------------
test.describe('POST /api/v1/colors', () => {
	test('ADMIN can create a color (201)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.post('/api/v1/colors', {
			headers: authHeader(token),
			data: colorPayload(),
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
		expect(body.data.name).toBeDefined();
		expect(body.data.hex).toBeDefined();
	});

	test('invalid hex returns 400 validation error', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.post('/api/v1/colors', {
			headers: authHeader(token),
			data: colorPayload('BadHex', 'not-a-hex'),
		});

		expect(res.status()).toBe(400);
	});
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/colors/:id
// ---------------------------------------------------------------------------
test.describe('PATCH /api/v1/colors/:id', () => {
	test('ADMIN can update a color (200)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		// Create a color first
		const createRes = await request.post('/api/v1/colors', {
			headers: authHeader(token),
			data: colorPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.patch(`/api/v1/colors/${created.id}`, {
			headers: authHeader(token),
			data: { name: 'UpdatedColor', hex: '#00FF00' },
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.name).toBe('UpdatedColor');
		expect(body.data.hex).toBe('#00FF00');
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/colors/:id
// ---------------------------------------------------------------------------
test.describe('DELETE /api/v1/colors/:id', () => {
	test('ADMIN can delete a color (204)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		// Create a color first
		const createRes = await request.post('/api/v1/colors', {
			headers: authHeader(token),
			data: colorPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/v1/colors/${created.id}`, {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(204);
	});

	test('nonexistent color returns 404', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.delete(
			'/api/v1/colors/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(token) },
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});
