import { test, expect } from '@playwright/test';
import { registerUser, loginAdmin, createDriverAccount, authHeader } from '../../helpers/auth.helper.js';
import { brandPayload, carPayload, tripPayload } from '../../helpers/test-data.js';

const API = '/api/v1';

test.describe('Trips API', () => {
	let adminToken: string;
	let driverToken: string;
	let userToken: string;
	let carId: string;

	test.beforeAll(async ({ request }) => {
		// Admin creates a brand
		const admin = await loginAdmin(request);
		adminToken = admin.token;

		const brandRes = await request.post(`${API}/brands`, {
			headers: authHeader(adminToken),
			data: brandPayload(),
		});
		const brandBody = await brandRes.json();
		expect(brandBody.success).toBe(true);
		const brandId = brandBody.data.id;

		// Driver creates a car
		const driver = await createDriverAccount(request);
		driverToken = driver.token;

		const carRes = await request.post(`${API}/cars`, {
			headers: authHeader(driverToken),
			data: carPayload(brandId),
		});
		const carBody = await carRes.json();
		expect(carBody.success).toBe(true);
		carId = carBody.data.id;

		// Register a regular user
		const user = await registerUser(request);
		userToken = user.token;
	});

	test.describe('POST /api/v1/trips', () => {
		test('DRIVER can create a trip and gets 201', async ({ request }) => {
			const res = await request.post(`${API}/trips`, {
				headers: authHeader(driverToken),
				data: tripPayload(carId),
			});

			expect(res.status()).toBe(201);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
			expect(body.data.id).toBeDefined();
		});

		test('USER gets 403 when creating a trip', async ({ request }) => {
			const res = await request.post(`${API}/trips`, {
				headers: authHeader(userToken),
				data: tripPayload(carId),
			});

			expect(res.status()).toBe(403);
		});
	});

	test.describe('GET /api/v1/trips', () => {
		test('USER can list trips and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/trips`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});
	});

	test.describe('GET /api/v1/trips/:id', () => {
		test('USER can get a trip by id and gets 200', async ({ request }) => {
			// Create a trip first
			const createRes = await request.post(`${API}/trips`, {
				headers: authHeader(driverToken),
				data: tripPayload(carId),
			});
			const createBody = await createRes.json();
			const tripId = createBody.data.id;

			const res = await request.get(`${API}/trips/${tripId}`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data.id).toBe(tripId);
		});
	});

	test.describe('GET /api/v1/trips/search', () => {
		test('USER can search trips and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/trips/search`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});
	});

	test.describe('GET /api/v1/trips/:id/passengers', () => {
		test('USER can get trip passengers and gets 200 (empty initially)', async ({ request }) => {
			// Create a trip first
			const createRes = await request.post(`${API}/trips`, {
				headers: authHeader(driverToken),
				data: tripPayload(carId),
			});
			const createBody = await createRes.json();
			const tripId = createBody.data.id;

			const res = await request.get(`${API}/trips/${tripId}/passengers`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});
	});

	test.describe('DELETE /api/v1/trips/:id', () => {
		test('DRIVER can delete a trip and gets 204', async ({ request }) => {
			// Create a trip first
			const createRes = await request.post(`${API}/trips`, {
				headers: authHeader(driverToken),
				data: tripPayload(carId),
			});
			const createBody = await createRes.json();
			const tripId = createBody.data.id;

			// Delete the trip
			const res = await request.delete(`${API}/trips/${tripId}`, {
				headers: authHeader(driverToken),
			});

			expect(res.status()).toBe(204);

			// Verify it's gone
			const getRes = await request.get(`${API}/trips/${tripId}`, {
				headers: authHeader(userToken),
			});

			expect(getRes.status()).toBe(404);
		});
	});
});
