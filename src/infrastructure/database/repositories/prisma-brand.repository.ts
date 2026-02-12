/**
 * @module prisma-brand.repository
 * Prisma-backed implementation of the {@link BrandRepository} domain interface.
 * Manages car brand (manufacturer) records. Brands are referenced by car models
 * via the integer brandRefId foreign key.
 */

import { inject, injectable } from 'tsyringe';
import type { BrandEntity, CreateBrandData } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link BrandRepository}.
 * Operates on the `brand` table which stores car manufacturer names.
 * Brands have a UUID primary key and an auto-incremented integer refId
 * used as FK by the `model` table.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaBrandRepository implements BrandRepository {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'BrandRepository' });
	}

	/**
	 * Retrieves all brand records with optional pagination.
	 * Runs findMany and count in parallel for efficient pagination.
	 * @param params - Optional pagination with `skip` and `take`.
	 * @returns `ok({ data, total })` with brand array and total count,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: BrandEntity[]; total: number }, DatabaseError>> {
		try {
			// Parallel queries: paginated data + total count
			const [data, total] = await Promise.all([
				this.prisma.brand.findMany({
					...(params && { skip: params.skip, take: params.take }),
				}),
				this.prisma.brand.count(),
			]);
			return ok({ data, total });
		} catch (e) {
			this.logger.error('Failed to find all brands', e instanceof Error ? e : null, { operation: 'findAll' });
			return err(new DatabaseError('Failed to find all brands', e));
		}
	}

	/**
	 * Finds a single brand by UUID.
	 * @param id - The UUID of the brand.
	 * @returns `ok(BrandEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<BrandEntity | null, DatabaseError>> {
		try {
			const brand = await this.prisma.brand.findUnique({
				where: { id },
			});
			return ok(brand);
		} catch (e) {
			this.logger.error('Failed to find brand by id', e instanceof Error ? e : null, { operation: 'findById', brandId: id });
			return err(new DatabaseError('Failed to find brand by id', e));
		}
	}

	/**
	 * Creates a new brand record.
	 * @param data - Brand creation data containing the brand name.
	 * @returns `ok(BrandEntity)` with the created brand,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateBrandData): Promise<Result<BrandEntity, DatabaseError>> {
		try {
			const brand = await this.prisma.brand.create({
				data: {
					name: data.name,
				},
			});
			return ok(brand);
		} catch (e) {
			this.logger.error('Failed to create brand', e instanceof Error ? e : null, { operation: 'create', name: data.name });
			return err(new DatabaseError('Failed to create brand', e));
		}
	}

	/**
	 * Deletes a brand record by UUID.
	 * @param id - The UUID of the brand to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.brand.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			this.logger.error('Failed to delete brand', e instanceof Error ? e : null, { operation: 'delete', brandId: id });
			return err(new DatabaseError('Failed to delete brand', e));
		}
	}
}
