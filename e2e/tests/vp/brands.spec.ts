import { test, expect } from '@playwright/test';
import { registerUser, loginAdmin, authHeader } from '../../helpers/auth.helper.js';
import { brandPayload } from '../../helpers/test-data.js';

// ---------------------------------------------------------------------------
// GET /api/vp/brands  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/brands', () => {
	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/vp/brands');
		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('USER role returns 200 with paginated data', async ({ request }) => {
		const { token } = await registerUser(request);

		const res = await request.get('/api/vp/brands', {
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

	test('ADMIN role returns 200', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.get('/api/vp/brands', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// POST /api/vp/brands  (ADMIN only)
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/brands', () => {
	test('ADMIN can create a brand (201)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.post('/api/vp/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
		expect(body.data.name).toBeDefined();
	});

	test('USER cannot create a brand (403)', async ({ request }) => {
		const { token } = await registerUser(request);

		const res = await request.post('/api/vp/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('no auth returns 401', async ({ request }) => {
		const res = await request.post('/api/vp/brands', {
			data: brandPayload(),
		});

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('empty name returns 500 (unhandled ZodError)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.post('/api/vp/brands', {
			headers: authHeader(token),
			data: { name: '' },
		});

		expect(res.status()).toBe(500);
	});
});

// ---------------------------------------------------------------------------
// PUT /api/vp/brands/:id  (ADMIN only)
// ---------------------------------------------------------------------------
test.describe('PUT /api/vp/brands/:id', () => {
	test('ADMIN can update a brand (200)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		// Create a brand first
		const createRes = await request.post('/api/vp/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});
		const { data: created } = await createRes.json();

		const updatedName = `Updated-${Date.now()}`;
		const res = await request.put(`/api/vp/brands/${created.id}`, {
			headers: authHeader(token),
			data: { name: updatedName },
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.name).toBe(updatedName);
	});

	test('USER cannot update a brand (403)', async ({ request }) => {
		const admin = await loginAdmin(request);
		const user = await registerUser(request);

		// Create a brand as admin
		const createRes = await request.post('/api/vp/brands', {
			headers: authHeader(admin.token),
			data: brandPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.put(`/api/vp/brands/${created.id}`, {
			headers: authHeader(user.token),
			data: { name: 'AttemptedUpdate' },
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('nonexistent brand returns 404', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.put(
			'/api/vp/brands/00000000-0000-0000-0000-000000000000',
			{
				headers: authHeader(token),
				data: { name: 'Ghost' },
			},
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error.code).toBe('BRAND_NOT_FOUND');
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/vp/brands/:id  (ADMIN only)
// ---------------------------------------------------------------------------
test.describe('DELETE /api/vp/brands/:id', () => {
	test('ADMIN can delete a brand (204)', async ({ request }) => {
		const { token } = await loginAdmin(request);

		// Create a brand first
		const createRes = await request.post('/api/vp/brands', {
			headers: authHeader(token),
			data: brandPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/vp/brands/${created.id}`, {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(204);
	});

	test('USER cannot delete a brand (403)', async ({ request }) => {
		const admin = await loginAdmin(request);
		const user = await registerUser(request);

		// Create a brand as admin
		const createRes = await request.post('/api/vp/brands', {
			headers: authHeader(admin.token),
			data: brandPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/vp/brands/${created.id}`, {
			headers: authHeader(user.token),
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('nonexistent brand returns 404', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.delete(
			'/api/vp/brands/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(token) },
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});
