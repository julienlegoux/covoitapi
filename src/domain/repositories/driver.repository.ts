/**
 * @module driver.repository
 * Defines the driver repository interface.
 * This contract abstracts persistence operations for Driver records,
 * allowing lookup by user reference and driver creation.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateDriverData, DriverEntity } from '../entities/driver.entity.js';

export interface DriverRepository {
	/**
	 * Finds a driver record by the associated user's refId.
	 * @param userRefId - The integer refId of the linked User record.
	 * @returns The matching DriverEntity, or null if the user is not a driver.
	 */
	findByUserRefId(userRefId: number): Promise<Result<DriverEntity | null, RepositoryError>>;

	/**
	 * Finds a driver record by the associated user's UUID via Prisma relation filter.
	 * Eliminates the need to first resolve the user UUID to a refId.
	 * @param userId - The UUID of the linked User record.
	 * @returns The matching DriverEntity, or null if the user is not a driver.
	 */
	findByUserId(userId: string): Promise<Result<DriverEntity | null, RepositoryError>>;

	/**
	 * Creates a new driver record.
	 * @param data - The driver data including license number and user reference.
	 * @returns The newly created DriverEntity.
	 */
	create(data: CreateDriverData): Promise<Result<DriverEntity, RepositoryError>>;
}
