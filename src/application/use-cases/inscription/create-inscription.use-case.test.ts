import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockRouteRepository } from '../../../../tests/setup.js';
import { AlreadyInscribedError, NoSeatsAvailableError, RouteNotFoundError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { CreateInscriptionUseCase } from './create-inscription.use-case.js';

describe('CreateInscriptionUseCase', () => {
	let useCase: CreateInscriptionUseCase;
	let mockInscriptionRepo: ReturnType<typeof createMockInscriptionRepository>;
	let mockRouteRepo: ReturnType<typeof createMockRouteRepository>;

	const validInput = { idpers: 'user-1', idtrajet: 'route-1' };
	const route = { id: 'route-1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' };

	beforeEach(() => {
		mockInscriptionRepo = createMockInscriptionRepository();
		mockRouteRepo = createMockRouteRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockInscriptionRepo);
		container.registerInstance(TOKENS.RouteRepository, mockRouteRepo);
		useCase = container.resolve(CreateInscriptionUseCase);
	});

	it('should create inscription successfully', async () => {
		const inscription = { id: 'i1', createdAt: new Date(), userId: 'user-1', routeId: 'route-1' };
		mockRouteRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(false));
		mockInscriptionRepo.countByRouteId.mockResolvedValue(ok(1));
		mockInscriptionRepo.create.mockResolvedValue(ok(inscription));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(inscription);
		expect(mockInscriptionRepo.create).toHaveBeenCalledWith({ userId: 'user-1', routeId: 'route-1' });
	});

	it('should return RouteNotFoundError when route does not exist', async () => {
		mockRouteRepo.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(RouteNotFoundError);
	});

	it('should return AlreadyInscribedError when user already inscribed', async () => {
		mockRouteRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(true));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(AlreadyInscribedError);
	});

	it('should return NoSeatsAvailableError when no seats left', async () => {
		mockRouteRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(false));
		mockInscriptionRepo.countByRouteId.mockResolvedValue(ok(3)); // seats = 3, count = 3
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(NoSeatsAvailableError);
	});

	it('should propagate error from routeRepository.findById', async () => {
		mockRouteRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from existsByUserAndRoute', async () => {
		mockRouteRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from countByRouteId', async () => {
		mockRouteRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(false));
		mockInscriptionRepo.countByRouteId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should not check seats when already inscribed', async () => {
		mockRouteRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(true));
		await useCase.execute(validInput);
		expect(mockInscriptionRepo.countByRouteId).not.toHaveBeenCalled();
	});
});
