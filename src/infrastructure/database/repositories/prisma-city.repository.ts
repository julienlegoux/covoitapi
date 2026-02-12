/**
 * @module prisma-city.repository
 * Prisma-backed implementation of the {@link CityRepository} domain interface.
 * Manages city records used as departure and arrival points for carpooling travels.
 * Cities are linked to travels via a join table using the integer cityRefId FK.
 */

import { inject, injectable } from 'tsyringe';
import type { CityEntity, CreateCityData } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link CityRepository}.
 * Operates on the `city` table which stores city names and zip codes.
 * Cities have a UUID primary key and an auto-incremented integer refId
 * used as FK by the travel-city join table.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaCityRepository implements CityRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	/**
	 * Retrieves all city records with optional pagination.
	 * Runs findMany and count in parallel for efficient pagination.
	 * @param params - Optional pagination with `skip` and `take`.
	 * @returns `ok({ data, total })` with city array and total count,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CityEntity[]; total: number }, DatabaseError>> {
		try {
			// Parallel queries: paginated data + total count
			const [data, total] = await Promise.all([
				this.prisma.city.findMany({
					...(params && { skip: params.skip, take: params.take }),
				}),
				this.prisma.city.count(),
			]);
			return ok({ data, total });
		} catch (e) {
			return err(new DatabaseError('Failed to find all cities', e));
		}
	}

	/**
	 * Finds a single city by UUID.
	 * @param id - The UUID of the city.
	 * @returns `ok(CityEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<CityEntity | null, DatabaseError>> {
		try {
			const city = await this.prisma.city.findUnique({
				where: { id },
			});
			return ok(city);
		} catch (e) {
			return err(new DatabaseError('Failed to find city by id', e));
		}
	}

	/**
	 * Finds a city by its name. Uses `findFirst` since city names may not
	 * have a unique constraint at the database level.
	 * @param name - The city name to search for.
	 * @returns `ok(CityEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findByCityName(name: string): Promise<Result<CityEntity | null, DatabaseError>> {
		try {
			// findFirst because cityName may not be a DB-level unique constraint
			const city = await this.prisma.city.findFirst({
				where: { cityName: name },
			});
			return ok(city);
		} catch (e) {
			return err(new DatabaseError('Failed to find city by name', e));
		}
	}

	/**
	 * Creates a new city record.
	 * @param data - City creation data with cityName and zipcode.
	 * @returns `ok(CityEntity)` with the created city,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateCityData): Promise<Result<CityEntity, DatabaseError>> {
		try {
			const city = await this.prisma.city.create({
				data: {
					cityName: data.cityName,
					zipcode: data.zipcode,
				},
			});
			return ok(city);
		} catch (e) {
			return err(new DatabaseError('Failed to create city', e));
		}
	}

	/**
	 * Deletes a city record by UUID.
	 * @param id - The UUID of the city to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.city.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete city', e));
		}
	}
}
