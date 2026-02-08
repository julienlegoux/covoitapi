import { inject, injectable } from 'tsyringe';
import type { BrandEntity, CreateBrandData } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaBrandRepository implements BrandRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: BrandEntity[]; total: number }, DatabaseError>> {
		try {
			const [data, total] = await Promise.all([
				this.prisma.brand.findMany({
					...(params && { skip: params.skip, take: params.take }),
				}),
				this.prisma.brand.count(),
			]);
			return ok({ data, total });
		} catch (e) {
			return err(new DatabaseError('Failed to find all brands', e));
		}
	}

	async findById(id: string): Promise<Result<BrandEntity | null, DatabaseError>> {
		try {
			const brand = await this.prisma.brand.findUnique({
				where: { id },
			});
			return ok(brand);
		} catch (e) {
			return err(new DatabaseError('Failed to find brand by id', e));
		}
	}

	async create(data: CreateBrandData): Promise<Result<BrandEntity, DatabaseError>> {
		try {
			const brand = await this.prisma.brand.create({
				data: {
					name: data.name,
				},
			});
			return ok(brand);
		} catch (e) {
			return err(new DatabaseError('Failed to create brand', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.brand.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete brand', e));
		}
	}
}
