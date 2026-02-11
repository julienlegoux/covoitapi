import { inject, injectable } from 'tsyringe';
import type { CarEntity, CreateCarData, UpdateCarData } from '../../../domain/entities/car.entity.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaCarRepository implements CarRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	private toEntity(car: { id: string; refId: number; immat: string; modelRefId: number }): CarEntity {
		return { id: car.id, refId: car.refId, licensePlate: car.immat, modelRefId: car.modelRefId };
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CarEntity[]; total: number }, DatabaseError>> {
		try {
			const [data, total] = await Promise.all([
				this.prisma.car.findMany({
					...(params && { skip: params.skip, take: params.take }),
				}),
				this.prisma.car.count(),
			]);
			return ok({ data: data.map((c) => this.toEntity(c)), total });
		} catch (e) {
			return err(new DatabaseError('Failed to find all cars', e));
		}
	}

	async findById(id: string): Promise<Result<CarEntity | null, DatabaseError>> {
		try {
			const car = await this.prisma.car.findUnique({
				where: { id },
			});
			return ok(car ? this.toEntity(car) : null);
		} catch (e) {
			return err(new DatabaseError('Failed to find car by id', e));
		}
	}

	async create(data: CreateCarData): Promise<Result<CarEntity, DatabaseError>> {
		try {
			const car = await this.prisma.car.create({
				data: {
					immat: data.licensePlate,
					modelRefId: data.modelRefId,
				},
			});
			return ok(this.toEntity(car));
		} catch (e) {
			return err(new DatabaseError('Failed to create car', e));
		}
	}

	async update(id: string, data: UpdateCarData): Promise<Result<CarEntity, DatabaseError>> {
		try {
			const car = await this.prisma.car.update({
				where: { id },
				data: {
					...(data.licensePlate !== undefined && { immat: data.licensePlate }),
					...(data.modelRefId !== undefined && { modelRefId: data.modelRefId }),
				},
			});
			return ok(this.toEntity(car));
		} catch (e) {
			return err(new DatabaseError('Failed to update car', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.car.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete car', e));
		}
	}

	async existsByLicensePlate(licensePlate: string): Promise<Result<boolean, DatabaseError>> {
		try {
			const count = await this.prisma.car.count({
				where: { immat: licensePlate },
			});
			return ok(count > 0);
		} catch (e) {
			return err(new DatabaseError('Failed to check if car exists', e));
		}
	}
}
