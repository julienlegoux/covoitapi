import { test, expect } from '@playwright/test';
import { registerUser, loginUser, authHeader } from '../../helpers/auth.helper.js';

const API = '/api/v1';

test.describe('POST /api/v1/drivers', () => {
	test('registers a user as a driver and returns 201', async ({ request }) => {
		const user = await registerUser(request);

		const res = await request.post(`${API}/drivers`, {
			headers: {
				...authHeader(user.token),
				'x-forwarded-for': `test-${Date.now()}-${Math.random()}`,
			},
			data: { driverLicense: `DL-${Date.now()}` },
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data).toBeDefined();
	});

	test('returns 401 when no auth token is provided', async ({ request }) => {
		const res = await request.post(`${API}/drivers`, {
			headers: {
				'x-forwarded-for': `test-${Date.now()}-${Math.random()}`,
			},
			data: { driverLicense: `DL-${Date.now()}` },
		});

		expect(res.status()).toBe(401);
	});

	test('re-login after driver creation gives DRIVER role', async ({ request }) => {
		// 1. Register as USER
		const user = await registerUser(request);

		// 2. Create driver profile
		const createRes = await request.post(`${API}/drivers`, {
			headers: {
				...authHeader(user.token),
				'x-forwarded-for': `test-${Date.now()}-${Math.random()}`,
			},
			data: { driverLicense: `DL-${Date.now()}` },
		});
		expect(createRes.status()).toBe(201);

		// 3. Re-login to get fresh token with DRIVER role
		const driver = await loginUser(request, user.email, user.password);

		// 4. Verify DRIVER role by accessing a DRIVER-only endpoint (GET /api/v1/cars)
		const carsRes = await request.get(`${API}/cars`, {
			headers: authHeader(driver.token),
		});
		expect(carsRes.status()).toBe(200);
	});
});
