import { test, expect } from '@playwright/test';
import {
	registerUser,
	createDriverAccount,
	loginAdmin,
	authHeader,
} from '../../helpers/auth.helper.js';
import { brandPayload } from '../../helpers/test-data.js';

// ---------------------------------------------------------------------------
// GET /api/v1/brands
// ---------------------------------------------------------------------------
test.describe('GET /api/v1/brands', () => {
	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/v1/brands');
		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('USER role returns 403', async ({ request }) => {
		const { token } = await registerUser(request);

		const res = await request.get('/api/v1/brands', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('DRIVER role returns 200 with paginated data', async ({ request }) => {
		const { token } = await createDriverAccount(request);

		const res = await request.get('/api/v1/brands', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data.data)).toBe(true);
		expect(body.data.meta).toBeDefined();
		expect(typeof body.data.meta.page).toBe('number');
		expect(typeof body.data.meta.limit).toBe('number');
		expect(typeof body.data.meta.total).toBe('number');
	});
});

// ---------------------------------------------------------------------------
// POST /api/v1/brands
// ---------------------------------------------------------------------------
test.describe('POST /api/v1/brands', () => {
	test('ADMIN can create a brand (201)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.post('/api/v1/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
		expect(body.data.name).toBeDefined();
	});

	test('DRIVER cannot create a brand (403)', async ({ request }) => {
		const { token } = await createDriverAccount(request);

		const res = await request.post('/api/v1/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('empty name returns 500 (ZodError thrown by controller)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.post('/api/v1/brands', {
			headers: authHeader(token),
			data: { name: '' },
		});

		expect(res.status()).toBe(500);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/brands/:id
// ---------------------------------------------------------------------------
test.describe('DELETE /api/v1/brands/:id', () => {
	test('ADMIN can delete a brand (204)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		// Create a brand first
		const createRes = await request.post('/api/v1/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/v1/brands/${created.id}`, {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(204);
	});

	test('nonexistent brand returns 404', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.delete(
			'/api/v1/brands/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(token) },
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});
