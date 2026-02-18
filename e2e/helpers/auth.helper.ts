/**
 * Auth helpers for E2E tests.
 * Handles user registration, login, driver creation, and admin login.
 * Each request uses a unique x-forwarded-for header to bypass rate limiting.
 */

import type { APIRequestContext } from '@playwright/test';

export interface AuthResult {
	token: string;
	userId: string;
	email: string;
	password: string;
}

let counter = 0;

function uniqueIp(): string {
	return `e2e-${Date.now()}-${++counter}`;
}

function uniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${++counter}@e2e.test`;
}

export async function registerUser(
	request: APIRequestContext,
	overrides?: { email?: string; password?: string },
): Promise<AuthResult> {
	const email = overrides?.email ?? uniqueEmail('user');
	const password = overrides?.password ?? 'TestPassword1';

	const res = await request.post('/api/v1/auth/register', {
		headers: { 'x-forwarded-for': uniqueIp() },
		data: { email, password, confirmPassword: password },
	});

	const body = await res.json();
	if (!body.success) {
		throw new Error(`Registration failed: ${JSON.stringify(body)}`);
	}
	return { token: body.data.token, userId: body.data.userId, email, password };
}

export async function loginUser(
	request: APIRequestContext,
	email: string,
	password: string,
): Promise<AuthResult> {
	const res = await request.post('/api/v1/auth/login', {
		headers: { 'x-forwarded-for': uniqueIp() },
		data: { email, password },
	});

	const body = await res.json();
	if (!body.success) {
		throw new Error(`Login failed: ${JSON.stringify(body)}`);
	}
	return { token: body.data.token, userId: body.data.userId, email, password };
}

export async function loginAdmin(
	request: APIRequestContext,
): Promise<AuthResult> {
	return loginUser(request, 'admin@e2e.test', 'AdminPassword1');
}

export async function createDriverAccount(
	request: APIRequestContext,
): Promise<AuthResult> {
	const email = uniqueEmail('driver');
	const password = 'TestPassword1';

	// 1. Register as USER
	const regRes = await request.post('/api/v1/auth/register', {
		headers: { 'x-forwarded-for': uniqueIp() },
		data: { email, password, confirmPassword: password },
	});
	const regBody = await regRes.json();
	if (!regBody.success) {
		throw new Error(`Driver registration failed: ${JSON.stringify(regBody)}`);
	}

	// 2. Create driver profile (upgrades role to DRIVER)
	await request.post('/api/v1/drivers', {
		headers: {
			'x-auth-token': regBody.data.token,
			'x-forwarded-for': uniqueIp(),
		},
		data: { driverLicense: `DL-${Date.now()}-${++counter}` },
	});

	// 3. Re-login to get a fresh token with DRIVER role
	const loginRes = await request.post('/api/v1/auth/login', {
		headers: { 'x-forwarded-for': uniqueIp() },
		data: { email, password },
	});
	const loginBody = await loginRes.json();
	if (!loginBody.success) {
		throw new Error(
			`Driver re-login failed: ${JSON.stringify(loginBody)}`,
		);
	}

	return {
		token: loginBody.data.token,
		userId: loginBody.data.userId,
		email,
		password,
	};
}

export function authHeader(token: string): Record<string, string> {
	return { 'x-auth-token': token };
}
