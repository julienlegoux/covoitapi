/**
 * @module prisma-inscription.repository
 * Prisma-backed implementation of the {@link InscriptionRepository} domain interface.
 * Manages passenger inscriptions (sign-ups) to carpooling trips.
 * Inscriptions link a user to a trip via integer refId foreign keys
 * (userRefId, tripRefId).
 */

import { inject, injectable } from 'tsyringe';
import type { CreateInscriptionData, InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link InscriptionRepository}.
 * Operates on the `inscription` table which represents a passenger's
 * registration for a carpooling trip. Uses integer refId FKs
 * (userRefId, tripRefId) to link to user and trip tables.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaInscriptionRepository implements InscriptionRepository {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'InscriptionRepository' });
	}

	/**
	 * Retrieves all inscriptions with optional pagination.
	 * Includes related user and trip data. Runs findMany and count
	 * in parallel for efficient pagination.
	 * @param params - Optional pagination with `skip` and `take`.
	 * @returns `ok({ data, total })` with paginated inscriptions and total count,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: InscriptionEntity[]; total: number }, DatabaseError>> {
		try {
			// Parallel queries: paginated data + total count
			const [inscriptions, total] = await Promise.all([
				this.prisma.inscription.findMany({
					...(params && { skip: params.skip, take: params.take }),
					// Include both user and trip relations for the list view
					include: { user: true, trip: true },
				}),
				this.prisma.inscription.count(),
			]);
			return ok({ data: inscriptions as unknown as InscriptionEntity[], total });
		} catch (e) {
			this.logger.error('Failed to find all inscriptions', e instanceof Error ? e : null, { operation: 'findAll' });
			return err(new DatabaseError('Failed to find all inscriptions', e));
		}
	}

	/**
	 * Finds a single inscription by UUID with related user and trip data.
	 * @param id - The UUID of the inscription.
	 * @returns `ok(InscriptionEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<InscriptionEntity | null, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.findUnique({
				where: { id },
				include: { user: true, trip: true },
			});
			return ok(inscription as unknown as InscriptionEntity | null);
		} catch (e) {
			this.logger.error('Failed to find inscription by ID', e instanceof Error ? e : null, { operation: 'findById', inscriptionId: id });
			return err(new DatabaseError('Failed to find inscription by id', e));
		}
	}

	/**
	 * Finds all inscriptions for a given user, identified by their integer refId.
	 * Includes the related trip data (but not the user, since it is already known).
	 * @param userRefId - The integer auto-incremented refId of the user.
	 * @returns `ok(InscriptionEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findByUserRefId(userRefId: number): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { userRefId },
				// Include trip but not user (caller already knows the user)
				include: { trip: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			this.logger.error('Failed to find inscriptions by user ref ID', e instanceof Error ? e : null, { operation: 'findByUserRefId', userRefId });
			return err(new DatabaseError('Failed to find inscriptions by user ref id', e));
		}
	}

	/**
	 * Finds all inscriptions for a given trip, identified by its integer refId.
	 * Includes the related user data (but not trip, since it is already known).
	 * @param tripRefId - The integer auto-incremented refId of the trip.
	 * @returns `ok(InscriptionEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findByTripRefId(tripRefId: number): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { tripRefId },
				// Include user but not trip (caller already knows the trip)
				include: { user: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			this.logger.error('Failed to find inscriptions by trip ref ID', e instanceof Error ? e : null, { operation: 'findByTripRefId', tripRefId });
			return err(new DatabaseError('Failed to find inscriptions by trip ref id', e));
		}
	}

	/**
	 * Finds all inscriptions for a user, identified by their UUID via a relation filter.
	 * Eliminates the need to first resolve the user UUID to a refId.
	 * @param userId - The UUID of the user.
	 * @returns `ok(InscriptionEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findByUserId(userId: string): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { user: { id: userId } },
				include: { trip: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			this.logger.error('Failed to find inscriptions by user id', e instanceof Error ? e : null, { operation: 'findByUserId', userId });
			return err(new DatabaseError('Failed to find inscriptions by user id', e));
		}
	}

	/**
	 * Finds all inscriptions for a trip, identified by its UUID via a relation filter.
	 * Eliminates the need to first resolve the trip UUID to a refId.
	 * @param tripId - The UUID of the trip.
	 * @returns `ok(InscriptionEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findByTripId(tripId: string): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { trip: { id: tripId } },
				include: { user: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			this.logger.error('Failed to find inscriptions by trip id', e instanceof Error ? e : null, { operation: 'findByTripId', tripId });
			return err(new DatabaseError('Failed to find inscriptions by trip id', e));
		}
	}

	/**
	 * Finds an inscription by its UUID and verifies it belongs to the given user.
	 * Combines existence check and ownership verification in a single query.
	 * @param id - The UUID of the inscription.
	 * @param userId - The UUID of the user (ownership check).
	 * @returns `ok(InscriptionEntity)` if found and owned, `ok(null)` otherwise,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findByIdAndUserId(id: string, userId: string): Promise<Result<InscriptionEntity | null, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.findFirst({
				where: { id, user: { id: userId } },
			});
			return ok(inscription as unknown as InscriptionEntity | null);
		} catch (e) {
			this.logger.error('Failed to find inscription by id and user id', e instanceof Error ? e : null, { operation: 'findByIdAndUserId', inscriptionId: id, userId });
			return err(new DatabaseError('Failed to find inscription by id and user id', e));
		}
	}

	/**
	 * Creates a new inscription linking a user to a trip via integer refIds.
	 * @param data - Inscription creation data with userRefId and tripRefId.
	 * @returns `ok(InscriptionEntity)` with the created inscription,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.create({
				data: {
					userRefId: data.userRefId,
					tripRefId: data.tripRefId,
				},
			});
			return ok(inscription);
		} catch (e) {
			this.logger.error('Failed to create inscription', e instanceof Error ? e : null, { operation: 'create', userRefId: data.userRefId, tripRefId: data.tripRefId });
			return err(new DatabaseError('Failed to create inscription', e));
		}
	}

	/**
	 * Deletes an inscription by UUID.
	 * @param id - The UUID of the inscription to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.inscription.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			this.logger.error('Failed to delete inscription', e instanceof Error ? e : null, { operation: 'delete', inscriptionId: id });
			return err(new DatabaseError('Failed to delete inscription', e));
		}
	}

	/**
	 * Checks if a user is already inscribed to a specific trip.
	 * Uses a count query for efficiency to avoid loading the full record.
	 * @param userRefId - The integer refId of the user.
	 * @param tripRefId - The integer refId of the trip.
	 * @returns `ok(true)` if an inscription exists, `ok(false)` otherwise,
	 *          or `err(DatabaseError)` on failure.
	 */
	async existsByUserAndTrip(userRefId: number, tripRefId: number): Promise<Result<boolean, DatabaseError>> {
		try {
			// Count query is more efficient than findFirst for existence checks
			const count = await this.prisma.inscription.count({
				where: { userRefId, tripRefId },
			});
			return ok(count > 0);
		} catch (e) {
			this.logger.error('Failed to check inscription existence', e instanceof Error ? e : null, { operation: 'existsByUserAndTrip', userRefId, tripRefId });
			return err(new DatabaseError('Failed to check inscription existence', e));
		}
	}

	/**
	 * Counts the number of inscriptions for a given trip.
	 * Used to check seat availability before allowing new inscriptions.
	 * @param tripRefId - The integer refId of the trip.
	 * @returns `ok(number)` with the inscription count, or `err(DatabaseError)` on failure.
	 */
	async countByTripRefId(tripRefId: number): Promise<Result<number, DatabaseError>> {
		try {
			const count = await this.prisma.inscription.count({
				where: { tripRefId },
			});
			return ok(count);
		} catch (e) {
			this.logger.error('Failed to count inscriptions for trip', e instanceof Error ? e : null, { operation: 'countByTripRefId', tripRefId });
			return err(new DatabaseError('Failed to count inscriptions for trip', e));
		}
	}
}
