import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockUserRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListUserInscriptionsUseCase } from './list-user-inscriptions.use-case.js';

describe('ListUserInscriptionsUseCase', () => {
	let useCase: ListUserInscriptionsUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;

	const user = { id: 'u1', refId: 5, authRefId: 10, firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'test@example.com', anonymizedAt: null, createdAt: new Date(), updatedAt: new Date() };

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		mockUserRepo = createMockUserRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		useCase = container.resolve(ListUserInscriptionsUseCase);
	});

	it('should return paginated inscriptions for user', async () => {
		const inscriptions = [{ id: '1', refId: 1, createdAt: new Date(), userRefId: 5, routeRefId: 1, status: 'ACTIVE' }];
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockRepo.findByUserRefId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1');

		expect(result.success).toBe(true);
		expect(mockUserRepo.findById).toHaveBeenCalledWith('u1');
		expect(mockRepo.findByUserRefId).toHaveBeenCalledWith(5);
		if (result.success) {
			expect(result.value.data).toEqual(inscriptions);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	it('should return empty array when user has none', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockRepo.findByUserRefId.mockResolvedValue(ok([]));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockRepo.findByUserRefId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(false);
	});

	it('should paginate results with custom pagination', async () => {
		const inscriptions = [
			{ id: '1', refId: 1, createdAt: new Date(), userRefId: 5, routeRefId: 1, status: 'ACTIVE' },
			{ id: '2', refId: 2, createdAt: new Date(), userRefId: 5, routeRefId: 2, status: 'ACTIVE' },
			{ id: '3', refId: 3, createdAt: new Date(), userRefId: 5, routeRefId: 3, status: 'ACTIVE' },
		];
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockRepo.findByUserRefId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1', { page: 2, limit: 1 });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([inscriptions[1]]);
			expect(result.value.meta).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3 });
		}
	});
});
