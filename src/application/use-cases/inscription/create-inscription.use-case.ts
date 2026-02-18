/**
 * @module CreateInscriptionUseCase
 *
 * Registers a passenger for a carpooling trip. An "inscription"
 * represents a user booking a seat on a specific trip. The use case
 * enforces that the user is not already inscribed and that seats remain
 * available on the trip.
 */

import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { AlreadyInscribedError, NoSeatsAvailableError, TripNotFoundError, UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
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
 * - {@link TripNotFoundError} - The target trip UUID does not exist
 * - {@link AlreadyInscribedError} - The user is already registered on this trip
 * - {@link NoSeatsAvailableError} - All seats on the trip are taken
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateInscriptionError = UserNotFoundError | TripNotFoundError | AlreadyInscribedError | NoSeatsAvailableError | RepositoryError;

/**
 * Registers a passenger on a carpooling trip.
 *
 * Business flow:
 * 1. Resolve the user UUID to get the internal refId
 * 2. Resolve the trip UUID to get the internal refId and seat count
 * 3. Check the user is not already inscribed on this trip
 * 4. Verify that available seats remain (current inscriptions < total seats)
 * 5. Create the inscription record
 *
 * @dependencies InscriptionRepository, TripRepository, UserRepository
 */
@injectable()
export class CreateInscriptionUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.TripRepository)
		private readonly tripRepository: TripRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'CreateInscriptionUseCase' });
	}

	/**
	 * Creates a new inscription for the authenticated user on the specified trip.
	 *
	 * @param input - Validated payload containing tripId and the authenticated userId
	 * @returns A Result containing the created InscriptionEntity on success,
	 *          or a CreateInscriptionError on failure
	 */
	async execute(input: WithAuthContext<CreateInscriptionSchemaType>): Promise<Result<InscriptionEntity, CreateInscriptionError>> {
		// Resolve user UUID to refId
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value || userResult.value.anonymizedAt !== null) {
			this.logger.warn('User not found for inscription creation', { userId: input.userId });
			return err(new UserNotFoundError(input.userId));
		}

		// Check trip exists and get refId
		const tripResult = await this.tripRepository.findById(input.tripId);
		if (!tripResult.success) {
			return tripResult;
		}
		if (!tripResult.value) {
			this.logger.warn('Trip not found for inscription creation', { tripId: input.tripId });
			return err(new TripNotFoundError(input.tripId));
		}

		const userRefId = userResult.value.refId;
		const tripRefId = tripResult.value.refId;

		// Check not already inscribed
		const existsResult = await this.inscriptionRepository.existsByUserAndTrip(userRefId, tripRefId);
		if (!existsResult.success) {
			return existsResult;
		}
		if (existsResult.value) {
			this.logger.warn('User already inscribed on trip', { userId: input.userId, tripId: input.tripId });
			return err(new AlreadyInscribedError(input.userId, input.tripId));
		}

		// Check seats available
		const countResult = await this.inscriptionRepository.countByTripRefId(tripRefId);
		if (!countResult.success) {
			return countResult;
		}

		const trip = tripResult.value;
		if (countResult.value >= trip.seats) {
			this.logger.warn('No seats available for inscription', { tripId: input.tripId });
			return err(new NoSeatsAvailableError(input.tripId));
		}

		const result = await this.inscriptionRepository.create({
			userRefId,
			tripRefId,
		});

		if (result.success) {
			this.logger.info('Inscription created', { inscriptionId: result.value.id });
		}

		return result;
	}
}
