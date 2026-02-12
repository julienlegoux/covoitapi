/**
 * @module prisma-driver.repository
 * Prisma-backed implementation of the {@link DriverRepository} domain interface.
 * Manages driver records that extend a user profile with a driver license.
 * Drivers are linked to users via the integer userRefId foreign key.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateDriverData, DriverEntity } from '../../../domain/entities/driver.entity.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link DriverRepository}.
 * Operates on the `driver` table which holds driver license information
 * and references the `user` table via the integer `userRefId` unique FK.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaDriverRepository implements DriverRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	/**
	 * Finds a driver record by the user's integer reference ID.
	 * Uses `findUnique` since userRefId is a unique constraint on the driver table.
	 * @param userRefId - The integer auto-incremented refId of the associated user.
	 * @returns `ok(DriverEntity)` if found, `ok(null)` if the user has no driver record,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findByUserRefId(userRefId: number): Promise<Result<DriverEntity | null, DatabaseError>> {
		try {
			// userRefId is a unique FK, so findUnique is appropriate
			const driver = await this.prisma.driver.findUnique({
				where: { userRefId },
			});
			return ok(driver);
		} catch (e) {
			return err(new DatabaseError('Failed to find driver by user ref id', e));
		}
	}

	/**
	 * Creates a new driver record linked to an existing user.
	 * @param data - Driver creation data containing driverLicense and userRefId.
	 * @returns `ok(DriverEntity)` with the created driver,
	 *          or `err(DatabaseError)` on failure (e.g. duplicate userRefId).
	 */
	async create(data: CreateDriverData): Promise<Result<DriverEntity, DatabaseError>> {
		try {
			const driver = await this.prisma.driver.create({
				data: {
					driverLicense: data.driverLicense,
					userRefId: data.userRefId,
				},
			});
			return ok(driver);
		} catch (e) {
			return err(new DatabaseError('Failed to create driver', e));
		}
	}
}
