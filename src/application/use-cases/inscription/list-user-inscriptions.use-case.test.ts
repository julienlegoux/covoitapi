/**
 * @file Unit tests for the ListUserInscriptionsUseCase.
 *
 * Covers inscription listing for a specific user with default and custom
 * pagination, empty results, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockLogger } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListUserInscriptionsUseCase } from './list-user-inscriptions.use-case.js';

// Test suite for listing a specific user's travel inscriptions
describe('ListUserInscriptionsUseCase', () => {
	let useCase: ListUserInscriptionsUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(ListUserInscriptionsUseCase);
	});

	// Happy path: returns user's inscriptions via UUID relation filter
	it('should return paginated inscriptions for user', async () => {
		const inscriptions = [{ id: '1', refId: 1, createdAt: new Date(), userRefId: 5, tripRefId: 1, status: 'ACTIVE' }];
		mockRepo.findByUserId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1');

		expect(result.success).toBe(true);
		expect(mockRepo.findByUserId).toHaveBeenCalledWith('u1');
		if (result.success) {
			expect(result.value.data).toEqual(inscriptions);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	// Edge case: user has no inscriptions
	it('should return empty array when user has none', async () => {
		mockRepo.findByUserId.mockResolvedValue(ok([]));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	// DB error during inscription fetch bubbles up
	it('should propagate repository error', async () => {
		mockRepo.findByUserId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(false);
	});

	// In-memory pagination: slices the full list with custom page/limit
	it('should paginate results with custom pagination', async () => {
		const inscriptions = [
			{ id: '1', refId: 1, createdAt: new Date(), userRefId: 5, tripRefId: 1, status: 'ACTIVE' },
			{ id: '2', refId: 2, createdAt: new Date(), userRefId: 5, tripRefId: 2, status: 'ACTIVE' },
			{ id: '3', refId: 3, createdAt: new Date(), userRefId: 5, tripRefId: 3, status: 'ACTIVE' },
		];
		mockRepo.findByUserId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1', { page: 2, limit: 1 });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([inscriptions[1]]);
			expect(result.value.meta).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3 });
		}
	});
});
