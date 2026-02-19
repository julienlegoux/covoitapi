import { test, expect } from '@playwright/test';
import { registerUser, loginAdmin, authHeader } from '../../helpers/auth.helper.js';
import { vpPersonPayload } from '../../helpers/test-data.js';

/**
 * Unique x-forwarded-for header to avoid rate-limit collisions.
 */
function forwardedFor(): Record<string, string> {
	return { 'x-forwarded-for': `test-${Date.now()}-${Math.random()}` };
}

/**
 * Helper: register a user via VP, then update their profile via POST /api/vp/persons.
 * Returns { id, firstname, lastname, phone, email, token }.
 */
async function createVpPerson(request: import('@playwright/test').APIRequestContext) {
	const payload = vpPersonPayload();

	// Step 1: Register via VP
	const regRes = await request.post('/api/vp/register', {
		headers: forwardedFor(),
		data: { email: payload.email, password: payload.password },
	});
	const regBody = await regRes.json();
	if (!regBody.success) {
		throw new Error(`VP registration failed: ${JSON.stringify(regBody)}`);
	}
	const token = regBody.data.token;
	const userId = regBody.data.userId;

	// Step 2: Update profile
	const profileRes = await request.post('/api/vp/persons', {
		headers: { ...forwardedFor(), ...authHeader(token) },
		data: {
			firstname: payload.firstname,
			lastname: payload.lastname,
			phone: payload.phone,
		},
	});
	const profileBody = await profileRes.json();
	if (!profileBody.success) {
		throw new Error(`VP person profile update failed: ${JSON.stringify(profileBody)}`);
	}

	return {
		id: userId,
		firstname: payload.firstname,
		lastname: payload.lastname,
		phone: payload.phone,
		email: payload.email,
		token,
	};
}

// ---------------------------------------------------------------------------
// POST /api/vp/persons  (USER+ — updates profile for authenticated user)
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/persons', () => {
	test('creates a person with auth+user+profile (201)', async ({ request }) => {
		const payload = vpPersonPayload();

		// Register first
		const regRes = await request.post('/api/vp/register', {
			headers: forwardedFor(),
			data: { email: payload.email, password: payload.password },
		});
		const regBody = await regRes.json();
		expect(regBody.success).toBe(true);

		// Update profile with auth
		const res = await request.post('/api/vp/persons', {
			headers: { ...forwardedFor(), ...authHeader(regBody.data.token) },
			data: {
				firstname: payload.firstname,
				lastname: payload.lastname,
				phone: payload.phone,
			},
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
		expect(body.data.firstname).toBe(payload.firstname);
		expect(body.data.lastname).toBe(payload.lastname);
		expect(body.data.email).toBe(payload.email);
	});

	test('no auth returns 401', async ({ request }) => {
		const res = await request.post('/api/vp/persons', {
			headers: forwardedFor(),
			data: { firstname: 'Test', lastname: 'User', phone: '0612345678' },
		});

		expect(res.status()).toBe(401);
	});

	test('missing fields returns 500 (unhandled ZodError)', async ({ request }) => {
		// Register first to get auth
		const { token } = await registerUser(request);

		const res = await request.post('/api/vp/persons', {
			headers: { ...forwardedFor(), ...authHeader(token) },
			data: { firstname: 'Only' },
		});

		expect(res.status()).toBe(500);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/persons  (ADMIN)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/persons', () => {
	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/vp/persons');
		expect(res.status()).toBe(401);
	});

	test('admin gets list (200)', async ({ request }) => {
		await createVpPerson(request);
		const { token } = await loginAdmin(request);

		const res = await request.get('/api/vp/persons', {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/persons/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/persons/:id', () => {
	test('returns a single person (200)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.get(`/api/vp/persons/${person.id}`, {
			headers: authHeader(person.token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.id).toBe(person.id);
		expect(body.data.firstname).toBe(person.firstname);
	});

	test('nonexistent person returns 404', async ({ request }) => {
		const { token } = await loginAdmin(request);

		const res = await request.get(
			'/api/vp/persons/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(token) },
		);

		expect(res.status()).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// PATCH /api/vp/persons/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('PATCH /api/vp/persons/:id', () => {
	test('updates firstname, lastname, phone (200)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.patch(`/api/vp/persons/${person.id}`, {
			headers: authHeader(person.token),
			data: {
				firstname: 'Updated',
				lastname: 'Name',
				phone: '0699999999',
			},
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.firstname).toBe('Updated');
		expect(body.data.lastname).toBe('Name');
	});

	test('patch with status=DELETED anonymizes (204)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.patch(`/api/vp/persons/${person.id}`, {
			headers: authHeader(person.token),
			data: { status: 'DELETED' },
		});

		expect(res.status()).toBe(204);
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/vp/persons/:id  (ADMIN)
// ---------------------------------------------------------------------------
test.describe('DELETE /api/vp/persons/:id', () => {
	test('admin deletes (anonymizes) a person (204)', async ({ request }) => {
		const person = await createVpPerson(request);
		const { token } = await loginAdmin(request);

		const res = await request.delete(`/api/vp/persons/${person.id}`, {
			headers: authHeader(token),
		});

		expect(res.status()).toBe(204);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/persons/:id/trips-driver  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/persons/:id/trips-driver', () => {
	test('returns empty array for non-driver (200)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.get(`/api/vp/persons/${person.id}/trips-driver`, {
			headers: authHeader(person.token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
		expect(body.data.length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/persons/:id/trips-passenger  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/persons/:id/trips-passenger', () => {
	test('returns passenger trips (200)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.get(`/api/vp/persons/${person.id}/trips-passenger`, {
			headers: authHeader(person.token),
		});

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
	});
});
