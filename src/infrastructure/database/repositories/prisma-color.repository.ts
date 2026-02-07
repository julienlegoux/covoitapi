import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
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

	async findAll(): Promise<Result<ColorEntity[], DatabaseError>> {
		try {
			const colors = await this.prisma.color.findMany();
			return ok(colors);
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
}
