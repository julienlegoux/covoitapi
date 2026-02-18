import { test, expect } from '@playwright/test';
import { registerUser, authHeader } from '../../helpers/auth.helper.js';
import { vpPersonPayload } from '../../helpers/test-data.js';

/**
 * Unique x-forwarded-for header to avoid rate-limit collisions.
 */
function forwardedFor(): Record<string, string> {
	return { 'x-forwarded-for': `test-${Date.now()}-${Math.random()}` };
}

/**
 * Helper: create a VP person and return { id, token, ...personData }.
 */
async function createVpPerson(request: import('@playwright/test').APIRequestContext) {
	const payload = vpPersonPayload();
	const res = await request.post('/api/vp/persons', {
		headers: forwardedFor(),
		data: payload,
	});
	const body = await res.json();
	if (!body.success) {
		throw new Error(`VP person creation failed: ${JSON.stringify(body)}`);
	}
	return body.data as {
		id: string;
		firstname: string;
		lastname: string;
		phone: string;
		email: string;
		token: string;
	};
}

// ---------------------------------------------------------------------------
// POST /api/vp/persons  (PUBLIC)
// ---------------------------------------------------------------------------
test.describe('POST /api/vp/persons', () => {
	test('creates a person with auth+user+profile (201)', async ({ request }) => {
		const payload = vpPersonPayload();

		const res = await request.post('/api/vp/persons', {
			headers: forwardedFor(),
			data: payload,
		});

		expect(res.status()).toBe(201);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.id).toBe('string');
		expect(body.data.firstname).toBe(payload.firstname);
		expect(body.data.lastname).toBe(payload.lastname);
		expect(body.data.email).toBe(payload.email);
		expect(typeof body.data.token).toBe('string');
	});

	test('duplicate email returns 409', async ({ request }) => {
		const payload = vpPersonPayload();

		// Create once
		await request.post('/api/vp/persons', {
			headers: forwardedFor(),
			data: payload,
		});

		// Create again with same email
		const res = await request.post('/api/vp/persons', {
			headers: forwardedFor(),
			data: vpPersonPayload({ email: payload.email }),
		});

		expect(res.status()).toBe(409);

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	test('missing fields returns 500 (unhandled ZodError)', async ({ request }) => {
		const res = await request.post('/api/vp/persons', {
			headers: forwardedFor(),
			data: { firstname: 'Only' },
		});

		expect(res.status()).toBe(500);
	});
});

// ---------------------------------------------------------------------------
// GET /api/vp/persons  (USER+)
// ---------------------------------------------------------------------------
test.describe('GET /api/vp/persons', () => {
	test('no auth returns 401', async ({ request }) => {
		const res = await request.get('/api/vp/persons');
		expect(res.status()).toBe(401);
	});

	test('authenticated user gets list (200)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.get('/api/vp/persons', {
			headers: authHeader(person.token),
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
		const person = await createVpPerson(request);

		const res = await request.get(
			'/api/vp/persons/00000000-0000-0000-0000-000000000000',
			{ headers: authHeader(person.token) },
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
// DELETE /api/vp/persons/:id  (USER+)
// ---------------------------------------------------------------------------
test.describe('DELETE /api/vp/persons/:id', () => {
	test('deletes (anonymizes) a person (204)', async ({ request }) => {
		const person = await createVpPerson(request);

		const res = await request.delete(`/api/vp/persons/${person.id}`, {
			headers: authHeader(person.token),
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
