/**
 * @module inscription.repository
 * Defines the inscription (booking) repository interface.
 * This contract abstracts persistence operations for passenger inscriptions on trips,
 * including paginated listing, lookup by user/trip, duplicate checking, and capacity counting.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateInscriptionData, InscriptionEntity } from '../entities/inscription.entity.js';

export interface InscriptionRepository {
	/**
	 * Retrieves a paginated list of all inscriptions.
	 * @param params - Optional pagination parameters (skip/take).
	 * @returns An object containing the data array and the total count.
	 */
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: InscriptionEntity[]; total: number }, RepositoryError>>;

	/**
	 * Finds an inscription by its UUID.
	 * @param id - The UUID of the inscription to find.
	 * @returns The matching InscriptionEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<InscriptionEntity | null, RepositoryError>>;

	/**
	 * Retrieves all inscriptions for a specific user.
	 * @param userRefId - The integer refId of the user.
	 * @returns An array of InscriptionEntity records for the user.
	 */
	findByUserRefId(userRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>>;

	/**
	 * Retrieves all inscriptions for a specific trip.
	 * @param tripRefId - The integer refId of the trip.
	 * @returns An array of InscriptionEntity records for the trip.
	 */
	findByTripRefId(tripRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>>;

	/**
	 * Retrieves all inscriptions for a user, identified by their UUID.
	 * Uses Prisma relation filter to avoid resolving the user UUID to refId.
	 * @param userId - The UUID of the user.
	 * @returns An array of InscriptionEntity records for the user.
	 */
	findByUserId(userId: string): Promise<Result<InscriptionEntity[], RepositoryError>>;

	/**
	 * Retrieves all inscriptions for a trip, identified by its UUID.
	 * Uses Prisma relation filter to avoid resolving the trip UUID to refId.
	 * @param tripId - The UUID of the trip.
	 * @returns An array of InscriptionEntity records for the trip.
	 */
	findByTripId(tripId: string): Promise<Result<InscriptionEntity[], RepositoryError>>;

	/**
	 * Finds an inscription by its UUID and verifies it belongs to the given user.
	 * Combines existence check and ownership verification in a single query.
	 * @param id - The UUID of the inscription.
	 * @param userId - The UUID of the user (ownership check).
	 * @returns The matching InscriptionEntity, or null if not found or not owned.
	 */
	findByIdAndUserId(id: string, userId: string): Promise<Result<InscriptionEntity | null, RepositoryError>>;

	/**
	 * Creates a new inscription (books a passenger on a trip).
	 * @param data - The user and trip references for the inscription.
	 * @returns The newly created InscriptionEntity.
	 */
	create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, RepositoryError>>;

	/**
	 * Deletes an inscription by UUID.
	 * @param id - The UUID of the inscription to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;

	/**
	 * Checks whether a user is already inscribed on a specific trip.
	 * Used to prevent duplicate bookings.
	 * @param userRefId - The integer refId of the user.
	 * @param tripRefId - The integer refId of the trip.
	 * @returns True if the inscription already exists.
	 */
	existsByUserAndTrip(userRefId: number, tripRefId: number): Promise<Result<boolean, RepositoryError>>;

	/**
	 * Counts the number of inscriptions for a given trip.
	 * Used to check seat availability before booking.
	 * @param tripRefId - The integer refId of the trip.
	 * @returns The count of inscriptions on the trip.
	 */
	countByTripRefId(tripRefId: number): Promise<Result<number, RepositoryError>>;
}
