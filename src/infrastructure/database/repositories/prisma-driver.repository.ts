import { inject, injectable } from 'tsyringe';
import type { CreateDriverData, DriverEntity } from '../../../domain/entities/driver.entity.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaDriverRepository implements DriverRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findByUserId(userId: string): Promise<Result<DriverEntity | null, DatabaseError>> {
		try {
			const driver = await this.prisma.driver.findUnique({
				where: { userId },
			});
			return ok(driver);
		} catch (e) {
			return err(new DatabaseError('Failed to find driver by user id', e));
		}
	}

	async create(data: CreateDriverData): Promise<Result<DriverEntity, DatabaseError>> {
		try {
			const driver = await this.prisma.driver.create({
				data: {
					driverLicense: data.driverLicense,
					userId: data.userId,
				},
			});
			return ok(driver);
		} catch (e) {
			return err(new DatabaseError('Failed to create driver', e));
		}
	}
}
