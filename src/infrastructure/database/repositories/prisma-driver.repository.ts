/**
 * @module prisma-driver.repository
 * Prisma-backed implementation of the {@link DriverRepository} domain interface.
 * Manages driver records that extend a user profile with a driver license.
 * Drivers are linked to users via the integer userRefId foreign key.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateDriverData, DriverEntity } from '../../../domain/entities/driver.entity.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
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
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'DriverRepository' });
	}

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
			this.logger.error('Failed to find driver by user ref id', e instanceof Error ? e : null, { operation: 'findByUserRefId', userRefId });
			return err(new DatabaseError('Failed to find driver by user ref id', e));
		}
	}

	/**
	 * Finds a driver record by the associated user's UUID via a relation filter.
	 * Eliminates the need to first resolve the user UUID to a refId.
	 * @param userId - The UUID of the linked User record.
	 * @returns `ok(DriverEntity)` if found, `ok(null)` if the user is not a driver,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findByUserId(userId: string): Promise<Result<DriverEntity | null, DatabaseError>> {
		try {
			const driver = await this.prisma.driver.findFirst({
				where: { user: { id: userId } },
			});
			return ok(driver);
		} catch (e) {
			this.logger.error('Failed to find driver by user id', e instanceof Error ? e : null, { operation: 'findByUserId', userId });
			return err(new DatabaseError('Failed to find driver by user id', e));
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
			this.logger.error('Failed to create driver', e instanceof Error ? e : null, { operation: 'create', userRefId: data.userRefId });
			return err(new DatabaseError('Failed to create driver', e));
		}
	}
}
