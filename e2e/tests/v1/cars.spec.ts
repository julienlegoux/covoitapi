import { test, expect } from '@playwright/test';
import { registerUser, loginAdmin, createDriverAccount, authHeader } from '../../helpers/auth.helper.js';
import { brandPayload, carPayload } from '../../helpers/test-data.js';

const API = '/api/v1';

test.describe('Cars API', () => {
	let adminToken: string;
	let driverToken: string;
	let userToken: string;
	let brandId: string;

	test.beforeAll(async ({ request }) => {
		// Create admin, driver, and regular user accounts
		const admin = await loginAdmin(request);
		adminToken = admin.token;

		const driver = await createDriverAccount(request);
		driverToken = driver.token;

		const user = await registerUser(request);
		userToken = user.token;

		// Admin creates a brand for car tests
		const brandRes = await request.post(`${API}/brands`, {
			headers: authHeader(adminToken),
			data: brandPayload(),
		});
		const brandBody = await brandRes.json();
		expect(brandBody.success).toBe(true);
		brandId = brandBody.data.id;
	});

	test.describe('GET /api/v1/cars', () => {
		test('DRIVER can list cars and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/cars`, {
				headers: authHeader(driverToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});

		test('USER gets 403 when listing cars', async ({ request }) => {
			const res = await request.get(`${API}/cars`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(403);
		});
	});

	test.describe('POST /api/v1/cars', () => {
		test('DRIVER can create a car and gets 201', async ({ request }) => {
			const res = await request.post(`${API}/cars`, {
				headers: authHeader(driverToken),
				data: carPayload(brandId),
			});

			expect(res.status()).toBe(201);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
			expect(body.data.id).toBeDefined();
		});

		test('returns 404 BRAND_NOT_FOUND with invalid brandId', async ({ request }) => {
			const fakeBrandId = '00000000-0000-0000-0000-000000000000';

			const res = await request.post(`${API}/cars`, {
				headers: authHeader(driverToken),
				data: carPayload(fakeBrandId),
			});

			expect(res.status()).toBe(404);

			const body = await res.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe('BRAND_NOT_FOUND');
		});
	});

	test.describe('PUT /api/v1/cars/:id', () => {
		test('DRIVER can fully update a car and gets 200', async ({ request }) => {
			// Create a car first
			const createRes = await request.post(`${API}/cars`, {
				headers: authHeader(driverToken),
				data: carPayload(brandId),
			});
			const createBody = await createRes.json();
			const carId = createBody.data.id;

			// Full update
			const res = await request.put(`${API}/cars/${carId}`, {
				headers: authHeader(driverToken),
				data: carPayload(brandId, 'UpdatedModel', `UP-${Date.now()}`),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
		});
	});

	test.describe('PATCH /api/v1/cars/:id', () => {
		test('DRIVER can partially update a car and gets 200', async ({ request }) => {
			// Create a car first
			const createRes = await request.post(`${API}/cars`, {
				headers: authHeader(driverToken),
				data: carPayload(brandId),
			});
			const createBody = await createRes.json();
			const carId = createBody.data.id;

			// Partial update - only change model
			const res = await request.patch(`${API}/cars/${carId}`, {
				headers: authHeader(driverToken),
				data: { model: 'PatchedModel' },
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});
	});

	test.describe('DELETE /api/v1/cars/:id', () => {
		test('DRIVER can delete a car and gets 204', async ({ request }) => {
			// Create a car first
			const createRes = await request.post(`${API}/cars`, {
				headers: authHeader(driverToken),
				data: carPayload(brandId),
			});
			const createBody = await createRes.json();
			const carId = createBody.data.id;

			// Delete the car
			const res = await request.delete(`${API}/cars/${carId}`, {
				headers: authHeader(driverToken),
			});

			expect(res.status()).toBe(204);
		});
	});
});
