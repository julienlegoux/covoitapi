import { test, expect } from '@playwright/test';
import {
	createDriverAccount,
	registerUser,
	loginAdmin,
	authHeader,
} from '../../helpers/auth.helper.js';
import { brandPayload, vpCarPayload, vpTripPayload } from '../../helpers/test-data.js';
import { getUserRefId } from '../../helpers/db.js';

// ---------------------------------------------------------------------------
// Shared setup: admin creates a brand, driver creates a car via VP.
// ---------------------------------------------------------------------------
let adminToken: string;
let driverToken: string;
let driverUserId: string;
let brandName: string;
let carId: string;

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

	// Create a driver account
	const driver = await createDriverAccount(request);
	driverToken = driver.token;
	driverUserId = driver.userId;

	// Driver creates a car via VP
	const carPayload = vpCarPayload(brandName);
	const carRes = await request.post('/api/vp/cars', {
		headers: authHeader(driverToken),
		data: carPayload,
	});
	const carBody = await carRes.json();
	if (!carBody.success) {
		throw new Error(`Car creation failed: ${JSON.stringify(carBody)}`);
	}
	carId = carBody.data.id;
});

// ---------------------------------------------------------------------------
// POST /api/vp/trips  (USER+)
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/trips', () => {
	test('creates a trip (201)', async ({ request }) => {
		const payload = vpTripPayload(carId);

		const res = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
	});

	test('no auth returns 401', async ({ request }) => {
		const payload = vpTripPayload(carId);

		const res = await request.post('/api/vp/trips', {
			data: payload,
		});

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('missing fields returns 400 validation error', async ({ request }) => {
		const res = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: { kms: 100 },
		});

		expect(res.status()).toBe(400);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/trips  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/trips', () => {
	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/vp/trips');
		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('authenticated user gets list (200)', async ({ request }) => {
		const res = await request.get('/api/vp/trips', {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/trips/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/trips/:id', () => {
	test('returns a single trip (200)', async ({ request }) => {
		// Create a trip first
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.get(`/api/vp/trips/${created.id}`, {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.id).toBe(created.id);
	});

	test('nonexistent trip returns 404', async ({ request }) => {
		const res = await request.get(
			'/api/vp/trips/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(driverToken) },
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// PATCH /api/vp/trips/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('PATCH /api/vp/trips/:id', () => {
	test('updates trip fields (200)', async ({ request }) => {
		// Create a trip first
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.patch(`/api/vp/trips/${created.id}`, {
			headers: authHeader(driverToken),
			data: { kms: 250, available_seats: 2 },
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
	});

	test('empty update returns 400', async ({ request }) => {
		// Create a trip first
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.patch(`/api/vp/trips/${created.id}`, {
			headers: authHeader(driverToken),
			data: {},
		});

		expect(res.status()).toBe(400);
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/vp/trips/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('DELETE /api/vp/trips/:id', () => {
	test('deletes a trip (204)', async ({ request }) => {
		// Create a trip first
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.delete(`/api/vp/trips/${created.id}`, {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(204);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/trips/:id/person  (USER+) - list passengers
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/trips/:id/person', () => {
	test('returns passenger list (200)', async ({ request }) => {
		// Create a trip first
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: created } = await createRes.json();

		const res = await request.get(`/api/vp/trips/${created.id}/person`, {
			headers: authHeader(driverToken),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// POST /api/vp/trips/:id/person  (USER+) - create inscription
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/trips/:id/person', () => {
	test('creates an inscription (201) when person_id matches auth user', async ({ request }) => {
		// Create a trip as driver
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: trip } = await createRes.json();

		// Register a second user (passenger)
		const passenger = await registerUser(request);
		const passengerRefId = await getUserRefId(passenger.userId);

		const res = await request.post(`/api/vp/trips/${trip.id}/person`, {
			headers: authHeader(passenger.token),
			data: { person_id: passengerRefId },
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
	});

	test('wrong person_id returns 403 FORBIDDEN', async ({ request }) => {
		// Create a trip as driver
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: trip } = await createRes.json();

		// Register a passenger but pass the driver's refId (different from passenger)
		const passenger = await registerUser(request);
		const driverRefId = await getUserRefId(driverUserId);

		const res = await request.post(`/api/vp/trips/${trip.id}/person`, {
			headers: authHeader(passenger.token),
			data: { person_id: driverRefId },
		});

		expect(res.status()).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error.code).toBe('FORBIDDEN');
	});

	test('no auth returns 401', async ({ request }) => {
		// Create a trip as driver
		const payload = vpTripPayload(carId);
		const createRes = await request.post('/api/vp/trips', {
			headers: authHeader(driverToken),
			data: payload,
		});
		const { data: trip } = await createRes.json();

		const res = await request.post(`/api/vp/trips/${trip.id}/person`, {
			data: { person_id: 1 },
		});

		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});
