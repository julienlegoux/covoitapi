import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import type { ColorRepository, CreateColorData, UpdateColorData } from '../../../domain/repositories/color.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaColorRepository implements ColorRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: ColorEntity[]; total: number }, DatabaseError>> {
		try {
			const [data, total] = await Promise.all([
				this.prisma.color.findMany({
					...(params && { skip: params.skip, take: params.take }),
				}),
				this.prisma.color.count(),
			]);
			return ok({ data, total });
		} catch (e) {
			return err(new DatabaseError('Failed to find all colors', e));
		}
	}

	async findById(id: string): Promise<Result<ColorEntity | null, DatabaseError>> {
		try {
			const color = await this.prisma.color.findUnique({
				where: { id },
			});
			return ok(color);
		} catch (e) {
			return err(new DatabaseError('Failed to find color by id', e));
		}
	}

	async findByName(name: string): Promise<Result<ColorEntity | null, DatabaseError>> {
		try {
			const color = await this.prisma.color.findFirst({
				where: { name },
			});
			return ok(color);
		} catch (e) {
			return err(new DatabaseError('Failed to find color by name', e));
		}
	}

	async create(data: CreateColorData): Promise<Result<ColorEntity, DatabaseError>> {
		try {
			const color = await this.prisma.color.create({
				data: {
					name: data.name,
					hex: data.hex,
				},
			});
			return ok(color);
		} catch (e) {
			return err(new DatabaseError('Failed to create color', e));
		}
	}

	async update(id: string, data: UpdateColorData): Promise<Result<ColorEntity, DatabaseError>> {
		try {
			const color = await this.prisma.color.update({
				where: { id },
				data,
			});
			return ok(color);
		} catch (e) {
			return err(new DatabaseError('Failed to update color', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.color.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete color', e));
		}
	}
}
