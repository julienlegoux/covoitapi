import { test, expect } from '@playwright/test';
import {
	createDriverAccount,
	loginAdmin,
	authHeader,
} from '../../helpers/auth.helper.js';
import { brandPayload, vpCarPayload } from '../../helpers/test-data.js';

// ---------------------------------------------------------------------------
// Shared setup: admin creates a brand, then a driver account is provisioned.
// ---------------------------------------------------------------------------
let adminToken: string;
let driverToken: string;
let brandName: string;

test.beforeAll(async ({ request }) => {
	// Admin creates a brand
	const admin = await loginAdmin(request);
	adminToken = admin.token;

	const bp = brandPayload();
	brandName = bp.name;
	const brandRes = await request.post('/api/vp/brands', {
		headers: authHeader(adminToken),
		data: bp,
	});
	const brandBody = await brandRes.json();
	if (!brandBody.success) {
		throw new Error(`Brand creation failed: ${JSON.stringify(brandBody)}`);
	}

	// Create a driver account (has USER+ permissions)
	const driver = await createDriverAccount(request);
	driverToken = driver.token;
});

// ---------------------------------------------------------------------------
// GET /api/vp/cars  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/cars', () => {
	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/vp/cars');
		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('authenticated user gets list (200)', async ({ request }) => {
		const res = await request.get('/api/vp/cars', {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data.data)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// POST /api/vp/cars  (USER+)
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/cars', () => {
	test('creates a car with brand NAME (201)', async ({ request }) => {
		const payload = vpCarPayload(brandName);

		const res = await request.post('/api/vp/cars', {
			headers: authHeader(driverToken),
			data: payload,
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
	});

	test('unknown brand returns 404 BRAND_NOT_FOUND', async ({ request }) => {
		const payload = vpCarPayload('NonExistentBrand-' + Date.now());

		const res = await request.post('/api/vp/cars', {
			headers: authHeader(driverToken),
			data: payload,
		});

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error.code).toBe('BRAND_NOT_FOUND');
	});

	test('no auth returns 401', async ({ request }) => {
		const payload = vpCarPayload(brandName);

		const res = await request.post('/api/vp/cars', {
			data: payload,
		});

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('missing fields returns 400', async ({ request }) => {
		const res = await request.post('/api/vp/cars', {
			headers: authHeader(driverToken),
			data: { model: 'OnlyModel' },
		});

		expect(res.status()).toBe(400);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/cars/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/cars/:id', () => {
	test('returns a single car (200)', async ({ request }) => {
		// Create a car first
		const payload = vpCarPayload(brandName);
		const createRes = await request.post('/api/vp/cars', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.get(`/api/vp/cars/${created.id}`, {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.id).toBe(created.id);
	});

	test('nonexistent car returns 404', async ({ request }) => {
		const res = await request.get(
			'/api/vp/cars/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(driverToken) },
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// PUT /api/vp/cars/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('PUT /api/vp/cars/:id', () => {
	test('updates a car (200)', async ({ request }) => {
		// Create a car first
		const payload = vpCarPayload(brandName);
		const createRes = await request.post('/api/vp/cars', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const updatedPayload = vpCarPayload(brandName, {
			model: 'UpdatedModel',
		});
		const res = await request.put(`/api/vp/cars/${created.id}`, {
			headers: authHeader(driverToken),
			data: updatedPayload,
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/vp/cars/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('DELETE /api/vp/cars/:id', () => {
	test('deletes a car (204)', async ({ request }) => {
		// Create a car first
		const payload = vpCarPayload(brandName);
		const createRes = await request.post('/api/vp/cars', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/vp/cars/${created.id}`, {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(204);
	});
});
