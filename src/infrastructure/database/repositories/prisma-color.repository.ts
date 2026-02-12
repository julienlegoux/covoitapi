/**
 * @module prisma-color.repository
 * Prisma-backed implementation of the {@link ColorRepository} domain interface.
 * Manages car color records with name and hex code values.
 */

import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import type { ColorRepository, CreateColorData, UpdateColorData } from '../../../domain/repositories/color.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link ColorRepository}.
 * Operates on the `color` table which stores color name and hex values
 * for car appearance records.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaColorRepository implements ColorRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	/**
	 * Retrieves all color records with optional pagination.
	 * Runs findMany and count in parallel for efficient pagination.
	 * @param params - Optional pagination with `skip` and `take`.
	 * @returns `ok({ data, total })` with color array and total count,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: ColorEntity[]; total: number }, DatabaseError>> {
		try {
			// Parallel queries: paginated data + total count
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

	/**
	 * Finds a single color by UUID.
	 * @param id - The UUID of the color.
	 * @returns `ok(ColorEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
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

	/**
	 * Finds a color by its name. Uses `findFirst` since the name field
	 * may not have a unique constraint at the database level.
	 * @param name - The color name to search for (e.g. "Red", "Blue").
	 * @returns `ok(ColorEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
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

	/**
	 * Creates a new color record with a name and hex code.
	 * @param data - Color creation data with name and hex.
	 * @returns `ok(ColorEntity)` with the created color,
	 *          or `err(DatabaseError)` on failure.
	 */
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

	/**
	 * Partially updates a color record identified by UUID.
	 * @param id - The UUID of the color to update.
	 * @param data - Partial update payload (name, hex).
	 * @returns `ok(ColorEntity)` with the updated color,
	 *          or `err(DatabaseError)` on failure.
	 */
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

	/**
	 * Deletes a color record by UUID.
	 * @param id - The UUID of the color to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
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
