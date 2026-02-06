import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { AlreadyInscribedError, NoSeatsAvailableError, RouteNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RouteRepository } from '../../../domain/repositories/route.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateInscriptionInput } from '../../dtos/inscription.dto.js';

type CreateInscriptionError = RouteNotFoundError | AlreadyInscribedError | NoSeatsAvailableError | RepositoryError;

@injectable()
export class CreateInscriptionUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.RouteRepository)
		private readonly routeRepository: RouteRepository,
	) {}

	async execute(input: CreateInscriptionInput): Promise<Result<InscriptionEntity, CreateInscriptionError>> {
		// Check route exists
		const routeResult = await this.routeRepository.findById(input.idtrajet);
		if (!routeResult.success) {
			return routeResult;
		}

		if (!routeResult.value) {
			return err(new RouteNotFoundError(input.idtrajet));
		}

		// Check not already inscribed
		const existsResult = await this.inscriptionRepository.existsByUserAndRoute(input.idpers, input.idtrajet);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			return err(new AlreadyInscribedError(input.idpers, input.idtrajet));
		}

		// Check seats available
		const countResult = await this.inscriptionRepository.countByRouteId(input.idtrajet);
		if (!countResult.success) {
			return countResult;
		}

		const route = routeResult.value;
		if (countResult.value >= route.seats) {
			return err(new NoSeatsAvailableError(input.idtrajet));
		}

		return this.inscriptionRepository.create({
			userId: input.idpers,
			routeId: input.idtrajet,
		});
	}
}
