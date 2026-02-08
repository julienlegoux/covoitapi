import { inject, injectable } from 'tsyringe';
import type { CreateInscriptionData, InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaInscriptionRepository implements InscriptionRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: InscriptionEntity[]; total: number }, DatabaseError>> {
		try {
			const [inscriptions, total] = await Promise.all([
				this.prisma.inscription.findMany({
					...(params && { skip: params.skip, take: params.take }),
					include: { user: true, travel: true },
				}),
				this.prisma.inscription.count(),
			]);
			return ok({ data: inscriptions as unknown as InscriptionEntity[], total });
		} catch (e) {
			return err(new DatabaseError('Failed to find all inscriptions', e));
		}
	}

	async findById(id: string): Promise<Result<InscriptionEntity | null, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.findUnique({
				where: { id },
				include: { user: true, travel: true },
			});
			return ok(inscription as unknown as InscriptionEntity | null);
		} catch (e) {
			return err(new DatabaseError('Failed to find inscription by id', e));
		}
	}

	async findByUserId(userId: string): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { userId },
				include: { travel: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			return err(new DatabaseError('Failed to find inscriptions by user id', e));
		}
	}

	async findByRouteId(routeId: string): Promise<Result<InscriptionEntity[], DatabaseError>> {
		try {
			const inscriptions = await this.prisma.inscription.findMany({
				where: { routeId },
				include: { user: true },
			});
			return ok(inscriptions as unknown as InscriptionEntity[]);
		} catch (e) {
			return err(new DatabaseError('Failed to find inscriptions by route id', e));
		}
	}

	async create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, DatabaseError>> {
		try {
			const inscription = await this.prisma.inscription.create({
				data: {
					userId: data.userId,
					routeId: data.routeId,
				},
			});
			return ok(inscription);
		} catch (e) {
			return err(new DatabaseError('Failed to create inscription', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.inscription.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete inscription', e));
		}
	}

	async existsByUserAndRoute(userId: string, routeId: string): Promise<Result<boolean, DatabaseError>> {
		try {
			const count = await this.prisma.inscription.count({
				where: { userId, routeId },
			});
			return ok(count > 0);
		} catch (e) {
			return err(new DatabaseError('Failed to check inscription existence', e));
		}
	}

	async countByRouteId(routeId: string): Promise<Result<number, DatabaseError>> {
		try {
			const count = await this.prisma.inscription.count({
				where: { routeId },
			});
			return ok(count);
		} catch (e) {
			return err(new DatabaseError('Failed to count inscriptions for route', e));
		}
	}
}
