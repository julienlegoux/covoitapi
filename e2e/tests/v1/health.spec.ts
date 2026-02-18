import { test, expect } from '@playwright/test';

test.describe('GET /api/health', () => {
	test('returns 200 with status ok and a timestamp', async ({ request }) => {
		const res = await request.get('/api/health');

		expect(res.status()).toBe(200);

		const body = await res.json();
		expect(body.status).toBe('ok');
		expect(typeof body.timestamp).toBe('string');
		// Timestamp should be a valid ISO-ish date string
		expect(new Date(body.timestamp).getTime()).not.toBeNaN();
	});
});
