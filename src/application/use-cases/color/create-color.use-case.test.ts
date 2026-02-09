import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockColorRepository } from '../../../../tests/setup.js';
import { ColorAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateColorUseCase } from './create-color.use-case.js';

describe('CreateColorUseCase', () => {
	let useCase: CreateColorUseCase;
	let mockColorRepository: ReturnType<typeof createMockColorRepository>;

	beforeEach(() => {
		mockColorRepository = createMockColorRepository();
		container.registerInstance(TOKENS.ColorRepository, mockColorRepository);
		useCase = container.resolve(CreateColorUseCase);
	});

	it('should create color successfully when name does not exist', async () => {
		const color = { id: '1', name: 'Red', hex: '#FF0000' };
		mockColorRepository.findByName.mockResolvedValue(ok(null));
		mockColorRepository.create.mockResolvedValue(ok(color));

		const result = await useCase.execute({ name: 'Red', hex: '#FF0000' });

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(color);
		expect(mockColorRepository.findByName).toHaveBeenCalledWith('Red');
		expect(mockColorRepository.create).toHaveBeenCalledWith({ name: 'Red', hex: '#FF0000' });
	});

	it('should return ColorAlreadyExistsError when name already exists', async () => {
		mockColorRepository.findByName.mockResolvedValue(ok({ id: '1', name: 'Red', hex: '#FF0000' }));

		const result = await useCase.execute({ name: 'Red', hex: '#FF0000' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ColorAlreadyExistsError);
		expect(mockColorRepository.create).not.toHaveBeenCalled();
	});

	it('should propagate repository error from findByName', async () => {
		mockColorRepository.findByName.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ name: 'Red', hex: '#FF0000' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
		expect(mockColorRepository.create).not.toHaveBeenCalled();
	});

	it('should propagate repository error from create', async () => {
		mockColorRepository.findByName.mockResolvedValue(ok(null));
		mockColorRepository.create.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ name: 'Red', hex: '#FF0000' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
