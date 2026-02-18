import { test, expect } from '@playwright/test';
import { registerUser, loginAdmin, createDriverAccount, authHeader } from '../../helpers/auth.helper.js';
import { brandPayload, carPayload, tripPayload } from '../../helpers/test-data.js';

const API = '/api/v1';

test.describe('Inscriptions API', () => {
	let driverToken: string;
	let userToken: string;
	let userId: string;
	let tripId: string;
	let carId: string;

	test.beforeAll(async ({ request }) => {
		// Admin creates a brand
		const admin = await loginAdmin(request);

		const brandRes = await request.post(`${API}/brands`, {
			headers: authHeader(admin.token),
			data: brandPayload(),
		});
		const brandBody = await brandRes.json();
		expect(brandBody.success).toBe(true);
		const brandId = brandBody.data.id;

		// Driver creates a car and a trip
		const driver = await createDriverAccount(request);
		driverToken = driver.token;

		const carRes = await request.post(`${API}/cars`, {
			headers: authHeader(driverToken),
			data: carPayload(brandId),
		});
		const carBody = await carRes.json();
		expect(carBody.success).toBe(true);
		carId = carBody.data.id;

		const tripRes = await request.post(`${API}/trips`, {
			headers: authHeader(driverToken),
			data: tripPayload(carId),
		});
		const tripBody = await tripRes.json();
		expect(tripBody.success).toBe(true);
		tripId = tripBody.data.id;

		// Register a regular user
		const user = await registerUser(request);
		userToken = user.token;
		userId = user.userId;
	});

	test.describe('POST /api/v1/inscriptions', () => {
		test('USER can create an inscription and gets 201', async ({ request }) => {
			const res = await request.post(`${API}/inscriptions`, {
				headers: authHeader(userToken),
				data: { tripId },
			});

			expect(res.status()).toBe(201);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
			expect(body.data.id).toBeDefined();
		});
	});

	test.describe('GET /api/v1/inscriptions', () => {
		test('USER can list inscriptions and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/inscriptions`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});
	});

	test.describe('GET /api/v1/users/:id/inscriptions', () => {
		test('USER can get own inscriptions and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/users/${userId}/inscriptions`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
		});
	});

	test.describe('DELETE /api/v1/inscriptions/:id', () => {
		test('USER can delete an inscription and gets 204', async ({ request }) => {
			// Create a new trip for a fresh inscription to delete
			const tripRes = await request.post(`${API}/trips`, {
				headers: authHeader(driverToken),
				data: tripPayload(carId),
			});
			const newTripId = (await tripRes.json()).data.id;

			// Create inscription
			const createRes = await request.post(`${API}/inscriptions`, {
				headers: authHeader(userToken),
				data: { tripId: newTripId },
			});
			expect(createRes.status()).toBe(201);
			const inscriptionId = (await createRes.json()).data.id;

			// Delete it
			const res = await request.delete(`${API}/inscriptions/${inscriptionId}`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(204);
		});
	});

	test.describe('No auth', () => {
		test('returns 401 when no auth token is provided', async ({ request }) => {
			const res = await request.get(`${API}/inscriptions`, {
				headers: {
					'x-forwarded-for': `test-${Date.now()}-${Math.random()}`,
				},
			});

			expect(res.status()).toBe(401);
		});
	});
});
