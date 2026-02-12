/**
 * @module CreateInscriptionUseCase
 *
 * Registers a passenger for a carpooling travel (route). An "inscription"
 * represents a user booking a seat on a specific travel. The use case
 * enforces that the user is not already inscribed and that seats remain
 * available on the travel.
 */

import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { AlreadyInscribedError, NoSeatsAvailableError, TravelNotFoundError, UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateInscriptionSchemaType } from '../../schemas/inscription.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

/**
 * Union of all possible error types returned by the create inscription use case.
 *
 * - {@link UserNotFoundError} - The authenticated user UUID does not exist
 * - {@link TravelNotFoundError} - The target travel UUID does not exist
 * - {@link AlreadyInscribedError} - The user is already registered on this travel
 * - {@link NoSeatsAvailableError} - All seats on the travel are taken
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateInscriptionError = UserNotFoundError | TravelNotFoundError | AlreadyInscribedError | NoSeatsAvailableError | RepositoryError;

/**
 * Registers a passenger on a carpooling travel.
 *
 * Business flow:
 * 1. Resolve the user UUID to get the internal refId
 * 2. Resolve the travel UUID to get the internal refId and seat count
 * 3. Check the user is not already inscribed on this travel
 * 4. Verify that available seats remain (current inscriptions < total seats)
 * 5. Create the inscription record
 *
 * @dependencies InscriptionRepository, TravelRepository, UserRepository
 */
@injectable()
export class CreateInscriptionUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'CreateInscriptionUseCase' });
	}

	/**
	 * Creates a new inscription for the authenticated user on the specified travel.
	 *
	 * @param input - Validated payload containing travelId and the authenticated userId
	 * @returns A Result containing the created InscriptionEntity on success,
	 *          or a CreateInscriptionError on failure
	 */
	async execute(input: WithAuthContext<CreateInscriptionSchemaType>): Promise<Result<InscriptionEntity, CreateInscriptionError>> {
		// Resolve user UUID to refId
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			this.logger.warn('User not found for inscription creation', { userId: input.userId });
			return err(new UserNotFoundError(input.userId));
		}

		// Check travel exists and get refId
		const travelResult = await this.travelRepository.findById(input.travelId);
		if (!travelResult.success) {
			return travelResult;
		}
		if (!travelResult.value) {
			this.logger.warn('Travel not found for inscription creation', { travelId: input.travelId });
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
			this.logger.warn('User already inscribed on travel', { userId: input.userId, travelId: input.travelId });
			return err(new AlreadyInscribedError(input.userId, input.travelId));
		}

		// Check seats available
		const countResult = await this.inscriptionRepository.countByRouteRefId(routeRefId);
		if (!countResult.success) {
			return countResult;
		}

		const travel = travelResult.value;
		if (countResult.value >= travel.seats) {
			this.logger.warn('No seats available for inscription', { travelId: input.travelId });
			return err(new NoSeatsAvailableError(input.travelId));
		}

		const result = await this.inscriptionRepository.create({
			userRefId,
			routeRefId,
		});

		if (result.success) {
			this.logger.info('Inscription created', { inscriptionId: result.value.id });
		}

		return result;
	}
}
