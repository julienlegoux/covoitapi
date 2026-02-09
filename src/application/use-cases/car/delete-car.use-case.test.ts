import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository } from '../../../../tests/setup.js';
import { CarNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteCarUseCase } from './delete-car.use-case.js';

describe('DeleteCarUseCase', () => {
	let useCase: DeleteCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		useCase = container.resolve(DeleteCarUseCase);
	});

	it('should delete car successfully', async () => {
		mockCarRepository.findById.mockResolvedValue(ok({ id: '1', immat: 'AB-123-CD', modelId: 'm1' }));
		mockCarRepository.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute('1');
		expect(result.success).toBe(true);
		expect(mockCarRepository.delete).toHaveBeenCalledWith('1');
	});

	it('should return CarNotFoundError when car not found', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarNotFoundError);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});

	it('should propagate repository error from findById', async () => {
		mockCarRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1');
		expect(result.success).toBe(false);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});
});
