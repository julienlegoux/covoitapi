import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository } from '../../../../tests/setup.js';
import { InscriptionNotFoundError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { DeleteInscriptionUseCase } from './delete-inscription.use-case.js';

describe('DeleteInscriptionUseCase', () => {
	let useCase: DeleteInscriptionUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		useCase = container.resolve(DeleteInscriptionUseCase);
	});

	it('should delete inscription successfully', async () => {
		mockRepo.findById.mockResolvedValue(ok({ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }));
		mockRepo.delete.mockResolvedValue(ok(undefined));
		const result = await useCase.execute('1');
		expect(result.success).toBe(true);
		expect(mockRepo.delete).toHaveBeenCalledWith('1');
	});

	it('should return InscriptionNotFoundError when not found', async () => {
		mockRepo.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(InscriptionNotFoundError);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	it('should propagate repository error', async () => {
		mockRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1');
		expect(result.success).toBe(false);
	});
});
