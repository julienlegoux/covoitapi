import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { registerMockJwtService, authHeaders } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('GET /api/health', () => {
	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
	});

	it('should return 200 with status ok', async () => {
		const res = await app.request('/api/health', { headers: authHeaders() });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('status', 'ok');
		expect(body).toHaveProperty('timestamp');
	});

	it('should return 200 without auth token (health is public)', async () => {
		const res = await app.request('/api/health');
		expect(res.status).toBe(200);
	});
});
