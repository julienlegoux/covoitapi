import { inject, injectable } from 'tsyringe';
import type { CreateModelData, ModelEntity } from '../../../domain/entities/model.entity.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaModelRepository implements ModelRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(): Promise<Result<ModelEntity[], DatabaseError>> {
		try {
			const models = await this.prisma.model.findMany();
			return ok(models);
		} catch (e) {
			return err(new DatabaseError('Failed to find all models', e));
		}
	}

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

	async findByNameAndBrand(name: string, brandId: string): Promise<Result<ModelEntity | null, DatabaseError>> {
		try {
			const model = await this.prisma.model.findFirst({
				where: { name, brandId },
			});
			return ok(model);
		} catch (e) {
			return err(new DatabaseError('Failed to find model by name and brand', e));
		}
	}

	async create(data: CreateModelData): Promise<Result<ModelEntity, DatabaseError>> {
		try {
			const model = await this.prisma.model.create({
				data: {
					name: data.name,
					brandId: data.brandId,
				},
			});
			return ok(model);
		} catch (e) {
			return err(new DatabaseError('Failed to create model', e));
		}
	}
}
