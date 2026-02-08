import { inject, injectable } from 'tsyringe';
import type { CreateTravelData, TravelEntity } from '../../../domain/entities/travel.entity.js';
import type { TravelFilters, TravelRepository } from '../../../domain/repositories/travel.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaTravelRepository implements TravelRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TravelEntity[]; total: number }, DatabaseError>> {
		try {
			const [routes, total] = await Promise.all([
				this.prisma.travel.findMany({
					...(params && { skip: params.skip, take: params.take }),
					include: {
						driver: { include: { user: true } },
						car: { include: { model: { include: { brand: true } } } },
						cities: { include: { city: true } },
					},
				}),
				this.prisma.travel.count(),
			]);
			return ok({ data: routes as unknown as TravelEntity[], total });
		} catch (e) {
			return err(new DatabaseError('Failed to find all travels', e));
		}
	}

	async findById(id: string): Promise<Result<TravelEntity | null, DatabaseError>> {
		try {
			const route = await this.prisma.travel.findUnique({
				where: { id },
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
					inscriptions: { include: { user: true } },
				},
			});
			return ok(route as unknown as TravelEntity | null);
		} catch (e) {
			return err(new DatabaseError('Failed to find travel by id', e));
		}
	}

	async findByFilters(filters: TravelFilters): Promise<Result<TravelEntity[], DatabaseError>> {
		try {
			const where: Record<string, unknown> = {};

			const andConditions: Record<string, unknown>[] = [];

			if (filters.departureCity) {
				andConditions.push({
					cities: {
						some: {
							type: 'DEPARTURE',
							city: { cityName: filters.departureCity },
						},
					},
				});
			}

			if (filters.arrivalCity) {
				andConditions.push({
					cities: {
						some: {
							type: 'ARRIVAL',
							city: { cityName: filters.arrivalCity },
						},
					},
				});
			}

			if (andConditions.length > 0) {
				where.AND = andConditions;
			}

			if (filters.date) {
				const startOfDay = new Date(filters.date);
				startOfDay.setUTCHours(0, 0, 0, 0);
				const endOfDay = new Date(filters.date);
				endOfDay.setUTCHours(23, 59, 59, 999);
				where.dateRoute = {
					gte: startOfDay,
					lte: endOfDay,
				};
			}

			const routes = await this.prisma.travel.findMany({
				where,
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
				},
			});
			return ok(routes as unknown as TravelEntity[]);
		} catch (e) {
			return err(new DatabaseError('Failed to find travels by filters', e));
		}
	}

	async create(data: CreateTravelData): Promise<Result<TravelEntity, DatabaseError>> {
		try {
			const route = await this.prisma.travel.create({
				data: {
					dateRoute: data.dateRoute,
					kms: data.kms,
					seats: data.seats,
					driverId: data.driverId,
					carId: data.carId,
					cities: data.cityIds?.length
						? {
								create: data.cityIds.map((cityId, index) => ({
									cityId,
									type: index === 0 ? 'DEPARTURE' as const : 'ARRIVAL' as const,
								})),
							}
						: undefined,
				},
			});
			return ok(route);
		} catch (e) {
			return err(new DatabaseError('Failed to create travel', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.travel.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete travel', e));
		}
	}
}
