/**
 * @file Unit tests for the ListTripPassengersUseCase.
 *
 * Covers passenger listing for a specific trip with default and custom
 * pagination, empty results, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockLogger } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListTripPassengersUseCase } from './list-trip-passengers.use-case.js';

// Test suite for listing passengers on a specific trip
describe('ListTripPassengersUseCase', () => {
    let useCase: ListTripPassengersUseCase;
    let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

    beforeEach(() => {
        mockRepo = createMockInscriptionRepository();
        container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
        container.registerInstance(TOKENS.Logger, createMockLogger());
        useCase = container.resolve(ListTripPassengersUseCase);
    });

    // Happy path: returns passengers via UUID relation filter
    it('should return paginated passengers for trip', async () => {
        const passengers = [{ id: '1', refId: 1, createdAt: new Date(), userRefId: 1, tripRefId: 10, status: 'ACTIVE' }];
        mockRepo.findByTripId.mockResolvedValue(ok(passengers));

        const result = await useCase.execute('r1');

        expect(result.success).toBe(true);
        expect(mockRepo.findByTripId).toHaveBeenCalledWith('r1');
        if (result.success) {
            expect(result.value.data).toEqual(passengers);
            expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
        }
    });

    // Edge case: no passengers inscribed on this trip
    it('should return empty array when no passengers', async () => {
        mockRepo.findByTripId.mockResolvedValue(ok([]));
        const result = await useCase.execute('r1');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.data).toEqual([]);
            expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
        }
    });

    // DB error during inscription fetch bubbles up
    it('should propagate repository error', async () => {
        mockRepo.findByTripId.mockResolvedValue(err(new DatabaseError('db error')));
        const result = await useCase.execute('r1');
        expect(result.success).toBe(false);
    });

    // In-memory pagination: slices the full list with custom page/limit
    it('should paginate results with custom pagination', async () => {
        const passengers = [
            { id: '1', refId: 1, createdAt: new Date(), userRefId: 1, tripRefId: 10, status: 'ACTIVE' },
            { id: '2', refId: 2, createdAt: new Date(), userRefId: 2, tripRefId: 10, status: 'ACTIVE' },
            { id: '3', refId: 3, createdAt: new Date(), userRefId: 3, tripRefId: 10, status: 'ACTIVE' },
        ];
        mockRepo.findByTripId.mockResolvedValue(ok(passengers));

        const result = await useCase.execute('r1', { page: 1, limit: 2 });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.data).toEqual([passengers[0], passengers[1]]);
            expect(result.value.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
        }
    });
});
