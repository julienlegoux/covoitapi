import { inject, injectable } from 'tsyringe';
import type { CreateRouteData, RouteEntity } from '../../../domain/entities/route.entity.js';
import type { RouteFilters, RouteRepository } from '../../../domain/repositories/route.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaRouteRepository implements RouteRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(): Promise<Result<RouteEntity[], DatabaseError>> {
		try {
			const routes = await this.prisma.route.findMany({
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
				},
			});
			return ok(routes as unknown as RouteEntity[]);
		} catch (e) {
			return err(new DatabaseError('Failed to find all routes', e));
		}
	}

	async findById(id: string): Promise<Result<RouteEntity | null, DatabaseError>> {
		try {
			const route = await this.prisma.route.findUnique({
				where: { id },
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
					inscriptions: { include: { user: true } },
				},
			});
			return ok(route as unknown as RouteEntity | null);
		} catch (e) {
			return err(new DatabaseError('Failed to find route by id', e));
		}
	}

	async findByFilters(filters: RouteFilters): Promise<Result<RouteEntity[], DatabaseError>> {
		try {
			const where: Record<string, unknown> = {};

			if (filters.departureCity || filters.arrivalCity) {
				where.cities = {
					some: {
						city: {
							cityName: {
								in: [filters.departureCity, filters.arrivalCity].filter(Boolean),
							},
						},
					},
				};
			}

			if (filters.date) {
				const startOfDay = new Date(filters.date);
				startOfDay.setHours(0, 0, 0, 0);
				const endOfDay = new Date(filters.date);
				endOfDay.setHours(23, 59, 59, 999);
				where.dateRoute = {
					gte: startOfDay,
					lte: endOfDay,
				};
			}

			const routes = await this.prisma.route.findMany({
				where,
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
				},
			});
			return ok(routes as unknown as RouteEntity[]);
		} catch (e) {
			return err(new DatabaseError('Failed to find routes by filters', e));
		}
	}

	async create(data: CreateRouteData): Promise<Result<RouteEntity, DatabaseError>> {
		try {
			const route = await this.prisma.route.create({
				data: {
					dateRoute: data.dateRoute,
					kms: data.kms,
					seats: data.seats,
					driverId: data.driverId,
					carId: data.carId,
					cities: data.cityIds?.length
						? {
								create: data.cityIds.map((cityId) => ({ cityId })),
							}
						: undefined,
				},
			});
			return ok(route);
		} catch (e) {
			return err(new DatabaseError('Failed to create route', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.route.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete route', e));
		}
	}
}
