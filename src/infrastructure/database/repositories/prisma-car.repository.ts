/**
 * @module prisma-car.repository
 * Prisma-backed implementation of the {@link CarRepository} domain interface.
 * Manages car records with license plate and model association.
 * Includes a field-mapping layer: the Prisma schema uses `immat` for the
 * license plate column, while the domain entity uses `licensePlate`.
 */

import { inject, injectable } from 'tsyringe';
import type { CarEntity, CreateCarData, UpdateCarData } from '../../../domain/entities/car.entity.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link CarRepository}.
 * Operates on the `car` table. Maps the Prisma column `immat` (immatriculation)
 * to the domain field `licensePlate` via the private {@link toEntity} helper.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaCarRepository implements CarRepository {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CarRepository' });
	}

	/**
	 * Maps a raw Prisma car record to the domain {@link CarEntity}.
	 * Renames `immat` (database column) to `licensePlate` (domain field).
	 * @param car - The raw Prisma car record with `immat` field.
	 * @returns A domain-conformant CarEntity.
	 */
	private toEntity(car: { id: string; refId: number; immat: string; modelRefId: number; driverRefId: number }): CarEntity {
		return { id: car.id, refId: car.refId, licensePlate: car.immat, modelRefId: car.modelRefId, driverRefId: car.driverRefId };
	}

	/**
	 * Retrieves all car records with optional pagination.
	 * Runs findMany and count in parallel for efficient pagination.
	 * @param params - Optional pagination with `skip` and `take`.
	 * @returns `ok({ data, total })` with mapped CarEntity array and total count,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CarEntity[]; total: number }, DatabaseError>> {
		try {
			// Parallel queries: paginated data + total count
			const [data, total] = await Promise.all([
				this.prisma.car.findMany({
					...(params && { skip: params.skip, take: params.take }),
				}),
				this.prisma.car.count(),
			]);
			return ok({ data: data.map((c) => this.toEntity(c)), total });
		} catch (e) {
			this.logger.error('Failed to find all cars', e instanceof Error ? e : null, { operation: 'findAll' });
			return err(new DatabaseError('Failed to find all cars', e));
		}
	}

	/**
	 * Finds a single car by UUID.
	 * @param id - The UUID of the car.
	 * @returns `ok(CarEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<CarEntity | null, DatabaseError>> {
		try {
			const car = await this.prisma.car.findUnique({
				where: { id },
			});
			return ok(car ? this.toEntity(car) : null);
		} catch (e) {
			this.logger.error('Failed to find car by id', e instanceof Error ? e : null, { operation: 'findById', carId: id });
			return err(new DatabaseError('Failed to find car by id', e));
		}
	}

	/**
	 * Creates a new car record. Maps domain `licensePlate` to Prisma `immat`.
	 * @param data - Car creation data with licensePlate and modelRefId.
	 * @returns `ok(CarEntity)` with the created car,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateCarData): Promise<Result<CarEntity, DatabaseError>> {
		try {
			const car = await this.prisma.car.create({
				data: {
					// Map domain field licensePlate to Prisma column immat
					immat: data.licensePlate,
					modelRefId: data.modelRefId,
					driverRefId: data.driverRefId,
				},
			});
			return ok(this.toEntity(car));
		} catch (e) {
			this.logger.error('Failed to create car', e instanceof Error ? e : null, { operation: 'create', licensePlate: data.licensePlate });
			return err(new DatabaseError('Failed to create car', e));
		}
	}

	/**
	 * Partially updates a car record. Only provided fields are updated.
	 * Maps domain `licensePlate` to Prisma `immat` when present.
	 * @param id - The UUID of the car to update.
	 * @param data - Partial update payload (licensePlate, modelRefId).
	 * @returns `ok(CarEntity)` with the updated car,
	 *          or `err(DatabaseError)` on failure.
	 */
	async update(id: string, data: UpdateCarData): Promise<Result<CarEntity, DatabaseError>> {
		try {
			const car = await this.prisma.car.update({
				where: { id },
				data: {
					// Conditionally spread: only include fields that are defined
					...(data.licensePlate !== undefined && { immat: data.licensePlate }),
					...(data.modelRefId !== undefined && { modelRefId: data.modelRefId }),
				},
			});
			return ok(this.toEntity(car));
		} catch (e) {
			this.logger.error('Failed to update car', e instanceof Error ? e : null, { operation: 'update', carId: id });
			return err(new DatabaseError('Failed to update car', e));
		}
	}

	/**
	 * Deletes a car record by UUID.
	 * @param id - The UUID of the car to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.car.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			this.logger.error('Failed to delete car', e instanceof Error ? e : null, { operation: 'delete', carId: id });
			return err(new DatabaseError('Failed to delete car', e));
		}
	}

	/**
	 * Checks whether a car with the given license plate already exists.
	 * Uses a count query on the `immat` column for efficiency.
	 * @param licensePlate - The license plate string to check.
	 * @returns `ok(true)` if a car with this plate exists, `ok(false)` otherwise,
	 *          or `err(DatabaseError)` on failure.
	 */
	async existsByLicensePlate(licensePlate: string): Promise<Result<boolean, DatabaseError>> {
		try {
			// Query the Prisma immat column with the domain licensePlate value
			const count = await this.prisma.car.count({
				where: { immat: licensePlate },
			});
			return ok(count > 0);
		} catch (e) {
			this.logger.error('Failed to check if car exists by license plate', e instanceof Error ? e : null, { operation: 'existsByLicensePlate', licensePlate });
			return err(new DatabaseError('Failed to check if car exists', e));
		}
	}
}
