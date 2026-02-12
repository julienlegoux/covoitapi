/**
 * @file Unit tests for the DeleteColorUseCase.
 *
 * Covers successful deletion, not-found guard, and repository error
 * propagation from both findById and delete operations.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockColorRepository } from '../../../../tests/setup.js';
import { ColorNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteColorUseCase } from './delete-color.use-case.js';

// Test suite for deleting colors by UUID
describe('DeleteColorUseCase', () => {
	let useCase: DeleteColorUseCase;
	let mockColorRepository: ReturnType<typeof createMockColorRepository>;

	beforeEach(() => {
		mockColorRepository = createMockColorRepository();
		container.registerInstance(TOKENS.ColorRepository, mockColorRepository);
		useCase = container.resolve(DeleteColorUseCase);
	});

	// Happy path: color exists and is deleted
	it('should delete color successfully when found', async () => {
		mockColorRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Red', hex: '#FF0000' }));
		mockColorRepository.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute('1');

		expect(result.success).toBe(true);
		expect(mockColorRepository.delete).toHaveBeenCalledWith('1');
	});

	// Not-found guard: null lookup returns ColorNotFoundError
	it('should return ColorNotFoundError when color does not exist', async () => {
		mockColorRepository.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute('999');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ColorNotFoundError);
		expect(mockColorRepository.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up and skips delete
	it('should propagate repository error from findById', async () => {
		mockColorRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute('1');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
		expect(mockColorRepository.delete).not.toHaveBeenCalled();
	});

	// DB error during deletion bubbles up
	it('should propagate repository error from delete', async () => {
		mockColorRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Red', hex: '#FF0000' }));
		mockColorRepository.delete.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute('1');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
