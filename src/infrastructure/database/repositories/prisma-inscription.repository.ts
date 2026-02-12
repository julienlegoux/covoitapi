/**
 * @module prisma-inscription.repository
 * Prisma-backed implementation of the {@link InscriptionRepository} domain interface.
 * Manages passenger inscriptions (sign-ups) to carpooling travels.
 * Inscriptions link a user to a travel via integer refId foreign keys
 * (userRefId, routeRefId).
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
 * registration for a carpooling travel. Uses integer refId FKs
 * (userRefId, routeRefId) to link to user and travel tables.
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
	 * Includes related user and travel data. Runs findMany and count
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
					// Include both user and travel relations for the list view
					include: { user: true, travel: true },
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
	 * Finds a single inscription by UUID with related user and travel data.
	 * @param id - The UUID of the inscription.
	 * @returns `ok(InscriptionEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<InscriptionEntity | null, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.findUnique({
				where: { id },
				include: { user: true, travel: true },
			});
			return ok(inscription as unknown as InscriptionEntity | null);
		} catch (e) {
			this.logger.error('Failed to find inscription by ID', e instanceof Error ? e : null, { operation: 'findById', inscriptionId: id });
			return err(new DatabaseError('Failed to find inscription by id', e));
		}
	}

	/**
	 * Finds all inscriptions for a given user, identified by their integer refId.
	 * Includes the related travel data (but not the user, since it is already known).
	 * @param userRefId - The integer auto-incremented refId of the user.
	 * @returns `ok(InscriptionEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findByUserRefId(userRefId: number): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { userRefId },
				// Include travel but not user (caller already knows the user)
				include: { travel: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			this.logger.error('Failed to find inscriptions by user ref ID', e instanceof Error ? e : null, { operation: 'findByUserRefId', userRefId });
			return err(new DatabaseError('Failed to find inscriptions by user ref id', e));
		}
	}

	/**
	 * Finds all inscriptions for a given travel/route, identified by its integer refId.
	 * Includes the related user data (but not travel, since it is already known).
	 * @param routeRefId - The integer auto-incremented refId of the travel.
	 * @returns `ok(InscriptionEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findByRouteRefId(routeRefId: number): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { routeRefId },
				// Include user but not travel (caller already knows the travel)
				include: { user: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			this.logger.error('Failed to find inscriptions by route ref ID', e instanceof Error ? e : null, { operation: 'findByRouteRefId', routeRefId });
			return err(new DatabaseError('Failed to find inscriptions by route ref id', e));
		}
	}

	/**
	 * Creates a new inscription linking a user to a travel via integer refIds.
	 * @param data - Inscription creation data with userRefId and routeRefId.
	 * @returns `ok(InscriptionEntity)` with the created inscription,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.create({
				data: {
					userRefId: data.userRefId,
					routeRefId: data.routeRefId,
				},
			});
			return ok(inscription);
		} catch (e) {
			this.logger.error('Failed to create inscription', e instanceof Error ? e : null, { operation: 'create', userRefId: data.userRefId, routeRefId: data.routeRefId });
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
	 * Checks if a user is already inscribed to a specific travel.
	 * Uses a count query for efficiency to avoid loading the full record.
	 * @param userRefId - The integer refId of the user.
	 * @param routeRefId - The integer refId of the travel.
	 * @returns `ok(true)` if an inscription exists, `ok(false)` otherwise,
	 *          or `err(DatabaseError)` on failure.
	 */
	async existsByUserAndRoute(userRefId: number, routeRefId: number): Promise<Result<boolean, DatabaseError>> {
		try {
			// Count query is more efficient than findFirst for existence checks
			const count = await this.prisma.inscription.count({
				where: { userRefId, routeRefId },
			});
			return ok(count > 0);
		} catch (e) {
			this.logger.error('Failed to check inscription existence', e instanceof Error ? e : null, { operation: 'existsByUserAndRoute', userRefId, routeRefId });
			return err(new DatabaseError('Failed to check inscription existence', e));
		}
	}

	/**
	 * Counts the number of inscriptions for a given travel/route.
	 * Used to check seat availability before allowing new inscriptions.
	 * @param routeRefId - The integer refId of the travel.
	 * @returns `ok(number)` with the inscription count, or `err(DatabaseError)` on failure.
	 */
	async countByRouteRefId(routeRefId: number): Promise<Result<number, DatabaseError>> {
		try {
			const count = await this.prisma.inscription.count({
				where: { routeRefId },
			});
			return ok(count);
		} catch (e) {
			this.logger.error('Failed to count inscriptions for route', e instanceof Error ? e : null, { operation: 'countByRouteRefId', routeRefId });
			return err(new DatabaseError('Failed to count inscriptions for route', e));
		}
	}
}
