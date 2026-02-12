/**
 * @module prisma-model.repository
 * Prisma-backed implementation of the {@link ModelRepository} domain interface.
 * Manages car model records (e.g. "Clio", "Golf"). Each model belongs to a
 * brand via the integer brandRefId foreign key.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateModelData, ModelEntity } from '../../../domain/entities/model.entity.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link ModelRepository}.
 * Operates on the `model` table which stores car model names linked
 * to brands via the integer `brandRefId` FK.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaModelRepository implements ModelRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	/**
	 * Retrieves all car model records.
	 * @returns `ok(ModelEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findAll(): Promise<Result<ModelEntity[], DatabaseError>> {
		try {
			const models = await this.prisma.model.findMany();
			return ok(models);
		} catch (e) {
			return err(new DatabaseError('Failed to find all models', e));
		}
	}

	/**
	 * Finds a single model by UUID.
	 * @param id - The UUID of the model.
	 * @returns `ok(ModelEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<ModelEntity | null, DatabaseError>> {
		try {
			const model = await this.prisma.model.findUnique({
				where: { id },
			});
			return ok(model);
		} catch (e) {
			return err(new DatabaseError('Failed to find model by id', e));
		}
	}

	/**
	 * Finds a model by its name and brand combination.
	 * Uses `findFirst` since the (name, brandRefId) pair is not a Prisma unique
	 * constraint but is expected to be logically unique.
	 * @param name - The model name (e.g. "Clio").
	 * @param brandRefId - The integer refId of the associated brand.
	 * @returns `ok(ModelEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findByNameAndBrand(name: string, brandRefId: number): Promise<Result<ModelEntity | null, DatabaseError>> {
		try {
			// findFirst because (name, brandRefId) may not be a DB-level unique constraint
			const model = await this.prisma.model.findFirst({
				where: { name, brandRefId },
			});
			return ok(model);
		} catch (e) {
			return err(new DatabaseError('Failed to find model by name and brand', e));
		}
	}

	/**
	 * Creates a new car model linked to an existing brand via integer brandRefId.
	 * @param data - Model creation data with name and brandRefId.
	 * @returns `ok(ModelEntity)` with the created model,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateModelData): Promise<Result<ModelEntity, DatabaseError>> {
		try {
			const model = await this.prisma.model.create({
				data: {
					name: data.name,
					brandRefId: data.brandRefId,
				},
			});
			return ok(model);
		} catch (e) {
			return err(new DatabaseError('Failed to create model', e));
		}
	}
}
