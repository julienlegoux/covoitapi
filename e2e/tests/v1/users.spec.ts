import { test, expect } from '@playwright/test';
import { registerUser, loginAdmin, authHeader } from '../../helpers/auth.helper.js';
import { profilePayload } from '../../helpers/test-data.js';

const API = '/api/v1';

test.describe('Users API', () => {
	let adminToken: string;
	let userToken: string;
	let userId: string;

	test.beforeAll(async ({ request }) => {
		const admin = await loginAdmin(request);
		adminToken = admin.token;

		const user = await registerUser(request);
		userToken = user.token;
		userId = user.userId;
	});

	test.describe('GET /api/v1/users', () => {
		test('ADMIN can list users and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/users`, {
				headers: authHeader(adminToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(Array.isArray(body.data)).toBe(true);
		});

		test('USER gets 403 when listing users', async ({ request }) => {
			const res = await request.get(`${API}/users`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(403);
		});
	});

	test.describe('GET /api/v1/users/:id', () => {
		test('USER can get own profile and gets 200', async ({ request }) => {
			const res = await request.get(`${API}/users/${userId}`, {
				headers: authHeader(userToken),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
		});
	});

	test.describe('PATCH /api/v1/users/me', () => {
		test('USER can update own profile and gets 200', async ({ request }) => {
			const res = await request.patch(`${API}/users/me`, {
				headers: authHeader(userToken),
				data: profilePayload('John', 'Doe', '0698765432'),
			});

			expect(res.status()).toBe(200);

			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
		});
	});

	test.describe('DELETE /api/v1/users/:id (admin)', () => {
		test('ADMIN can delete a user and gets 204', async ({ request }) => {
			// Create a fresh user to delete
			const target = await registerUser(request);

			const res = await request.delete(`${API}/users/${target.userId}`, {
				headers: authHeader(adminToken),
			});

			expect(res.status()).toBe(204);
		});
	});

	test.describe('DELETE /api/v1/users/me', () => {
		test('USER can self-anonymize and gets 204', async ({ request }) => {
			// Create a fresh user for self-anonymization
			const victim = await registerUser(request);

			const res = await request.delete(`${API}/users/me`, {
				headers: authHeader(victim.token),
			});

			expect(res.status()).toBe(204);
		});
	});

	test.describe('No auth', () => {
		test('returns 401 when no auth token is provided', async ({ request }) => {
			const res = await request.get(`${API}/users`, {
				headers: {
					'x-forwarded-for': `test-${Date.now()}-${Math.random()}`,
				},
			});

			expect(res.status()).toBe(401);
		});
	});
});
