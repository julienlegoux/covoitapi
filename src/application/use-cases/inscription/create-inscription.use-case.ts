import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { AlreadyInscribedError, NoSeatsAvailableError, TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateInscriptionInput } from '../../dtos/inscription.dto.js';

type CreateInscriptionError = TravelNotFoundError | AlreadyInscribedError | NoSeatsAvailableError | RepositoryError;

@injectable()
export class CreateInscriptionUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	async execute(input: CreateInscriptionInput): Promise<Result<InscriptionEntity, CreateInscriptionError>> {
		// Check travel exists
		const travelResult = await this.travelRepository.findById(input.idtrajet);
		if (!travelResult.success) {
			return travelResult;
		}

		if (!travelResult.value) {
			return err(new TravelNotFoundError(input.idtrajet));
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

		const travel = travelResult.value;
		if (countResult.value >= travel.seats) {
			return err(new NoSeatsAvailableError(input.idtrajet));
		}

		return this.inscriptionRepository.create({
			userId: input.idpers,
			routeId: input.idtrajet,
		});
	}
}
