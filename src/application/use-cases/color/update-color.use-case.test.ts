/**
 * @file Unit tests for the UpdateColorUseCase.
 *
 * Covers full and partial updates (name only, hex only, both),
 * not-found guard, and repository error propagation from findById and update.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockColorRepository } from '../../../../tests/setup.js';
import { ColorNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { UpdateColorUseCase } from './update-color.use-case.js';

// Test suite for partial color updates
describe('UpdateColorUseCase', () => {
	let useCase: UpdateColorUseCase;
	let mockColorRepository: ReturnType<typeof createMockColorRepository>;

	beforeEach(() => {
		mockColorRepository = createMockColorRepository();
		container.registerInstance(TOKENS.ColorRepository, mockColorRepository);
		useCase = container.resolve(UpdateColorUseCase);
	});

	// Full update: both name and hex are changed
	it('should update color successfully when found', async () => {
		const existingColor = { id: '1', name: 'Red', hex: '#FF0000' };
		const updatedColor = { id: '1', name: 'Dark Red', hex: '#CC0000' };
		mockColorRepository.findById.mockResolvedValue(ok(existingColor));
		mockColorRepository.update.mockResolvedValue(ok(updatedColor));

		const result = await useCase.execute({ id: '1', name: 'Dark Red', hex: '#CC0000' });

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(updatedColor);
		expect(mockColorRepository.update).toHaveBeenCalledWith('1', { name: 'Dark Red', hex: '#CC0000' });
	});

	// Partial update: only name, hex stays unchanged
	it('should update only name when hex is not provided', async () => {
		const existingColor = { id: '1', name: 'Red', hex: '#FF0000' };
		const updatedColor = { id: '1', name: 'Dark Red', hex: '#FF0000' };
		mockColorRepository.findById.mockResolvedValue(ok(existingColor));
		mockColorRepository.update.mockResolvedValue(ok(updatedColor));

		const result = await useCase.execute({ id: '1', name: 'Dark Red' });

		expect(result.success).toBe(true);
		expect(mockColorRepository.update).toHaveBeenCalledWith('1', { name: 'Dark Red' });
	});

	// Partial update: only hex, name stays unchanged
	it('should update only hex when name is not provided', async () => {
		const existingColor = { id: '1', name: 'Red', hex: '#FF0000' };
		const updatedColor = { id: '1', name: 'Red', hex: '#CC0000' };
		mockColorRepository.findById.mockResolvedValue(ok(existingColor));
		mockColorRepository.update.mockResolvedValue(ok(updatedColor));

		const result = await useCase.execute({ id: '1', hex: '#CC0000' });

		expect(result.success).toBe(true);
		expect(mockColorRepository.update).toHaveBeenCalledWith('1', { hex: '#CC0000' });
	});

	// Not-found guard: missing color returns ColorNotFoundError
	it('should return ColorNotFoundError when color does not exist', async () => {
		mockColorRepository.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute({ id: '999', name: 'Dark Red' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ColorNotFoundError);
		expect(mockColorRepository.update).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up and skips update
	it('should propagate repository error from findById', async () => {
		mockColorRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ id: '1', name: 'Dark Red' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
		expect(mockColorRepository.update).not.toHaveBeenCalled();
	});

	// DB error during update bubbles up
	it('should propagate repository error from update', async () => {
		mockColorRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Red', hex: '#FF0000' }));
		mockColorRepository.update.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ id: '1', name: 'Dark Red' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
