import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { AlreadyInscribedError, NoSeatsAvailableError, TravelNotFoundError, UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateInscriptionSchemaType } from '../../schemas/inscription.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

type CreateInscriptionError = UserNotFoundError | TravelNotFoundError | AlreadyInscribedError | NoSeatsAvailableError | RepositoryError;

@injectable()
export class CreateInscriptionUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	async execute(input: WithAuthContext<CreateInscriptionSchemaType>): Promise<Result<InscriptionEntity, CreateInscriptionError>> {
		// Resolve user UUID to refId
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			return err(new UserNotFoundError(input.userId));
		}

		// Check travel exists and get refId
		const travelResult = await this.travelRepository.findById(input.travelId);
		if (!travelResult.success) {
			return travelResult;
		}
		if (!travelResult.value) {
			return err(new TravelNotFoundError(input.travelId));
		}

		const userRefId = userResult.value.refId;
		const routeRefId = travelResult.value.refId;

		// Check not already inscribed
		const existsResult = await this.inscriptionRepository.existsByUserAndRoute(userRefId, routeRefId);
		if (!existsResult.success) {
			return existsResult;
		}
		if (existsResult.value) {
			return err(new AlreadyInscribedError(input.userId, input.travelId));
		}

		// Check seats available
		const countResult = await this.inscriptionRepository.countByRouteRefId(routeRefId);
		if (!countResult.success) {
			return countResult;
		}

		const travel = travelResult.value;
		if (countResult.value >= travel.seats) {
			return err(new NoSeatsAvailableError(input.travelId));
		}

		return this.inscriptionRepository.create({
			userRefId,
			routeRefId,
		});
	}
}
