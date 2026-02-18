import { test, expect } from '@playwright/test';
import {
	registerUser,
	loginAdmin,
	authHeader,
} from '../../helpers/auth.helper.js';
import { cityPayload } from '../../helpers/test-data.js';

// ---------------------------------------------------------------------------
// GET /api/v1/cities
// ---------------------------------------------------------------------------
test.describe('GET /api/v1/cities', () => {
	test('USER role returns 200', async ({ request }) => {
		const { token } = await registerUser(request);

		const res = await request.get('/api/v1/cities', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data.data)).toBe(true);
		expect(body.data.meta).toBeDefined();
	});

	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/v1/cities');

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// POST /api/v1/cities
// ---------------------------------------------------------------------------
test.describe('POST /api/v1/cities', () => {
	test('USER can create a city (201)', async ({ request }) => {
		const { token } = await registerUser(request);

		const res = await request.post('/api/v1/cities', {
			headers: authHeader(token),
			data: cityPayload(),
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
		expect(body.data.cityName).toBeDefined();
		expect(body.data.zipcode).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/cities/:id
// ---------------------------------------------------------------------------
test.describe('DELETE /api/v1/cities/:id', () => {
	test('ADMIN can delete a city (204)', async ({ request }) => {
		const admin = await loginAdmin(request);

		// Create a city first (admin is USER+ so can create)
		const createRes = await request.post('/api/v1/cities', {
			headers: authHeader(admin.token),
			data: cityPayload(),
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/v1/cities/${created.id}`, {
			headers: authHeader(admin.token),
		});

		expect(res.status()).toBe(204);
	});

	test('USER cannot delete a city (403)', async ({ request }) => {
		const admin = await loginAdmin(request);
		const user = await registerUser(request);

		// Create a city as admin
		const createRes = await request.post('/api/v1/cities', {
			headers: authHeader(admin.token),
			data: cityPayload(),
		});
		const { data: created } = await createRes.json();

		// Attempt to delete as USER
		const res = await request.delete(`/api/v1/cities/${created.id}`, {
			headers: authHeader(user.token),
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});
