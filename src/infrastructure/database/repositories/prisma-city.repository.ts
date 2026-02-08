import { inject, injectable } from 'tsyringe';
import type { CityEntity, CreateCityData } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaCityRepository implements CityRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CityEntity[]; total: number }, DatabaseError>> {
		try {
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

	async findByCityName(name: string): Promise<Result<CityEntity | null, DatabaseError>> {
		try {
			const city = await this.prisma.city.findFirst({
				where: { cityName: name },
			});
			return ok(city);
		} catch (e) {
			return err(new DatabaseError('Failed to find city by name', e));
		}
	}

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
