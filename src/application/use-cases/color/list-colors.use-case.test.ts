import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockColorRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListColorsUseCase } from './list-colors.use-case.js';

describe('ListColorsUseCase', () => {
	let useCase: ListColorsUseCase;
	let mockColorRepository: ReturnType<typeof createMockColorRepository>;

	beforeEach(() => {
		mockColorRepository = createMockColorRepository();
		container.registerInstance(TOKENS.ColorRepository, mockColorRepository);
		useCase = container.resolve(ListColorsUseCase);
	});

	it('should return paginated list of colors', async () => {
		const colors = [
			{ id: '1', name: 'Red', hex: '#FF0000' },
			{ id: '2', name: 'Blue', hex: '#0000FF' },
		];
		mockColorRepository.findAll.mockResolvedValue(ok({ data: colors, total: 2 }));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(colors);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
		}
	});

	it('should return empty array when no colors', async () => {
		mockColorRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockColorRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute();

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});

	it('should pass pagination params to repository', async () => {
		mockColorRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		await useCase.execute({ page: 2, limit: 10 });
		expect(mockColorRepository.findAll).toHaveBeenCalledWith({ skip: 10, take: 10 });
	});
});
