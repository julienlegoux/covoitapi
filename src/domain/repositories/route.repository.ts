import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CreateRouteData, RouteEntity } from '../entities/route.entity.js';

export type RouteFilters = {
	departureCity?: string;
	arrivalCity?: string;
	date?: Date;
};

export interface RouteRepository {
	findAll(): Promise<Result<RouteEntity[], RepositoryError>>;
	findById(id: string): Promise<Result<RouteEntity | null, RepositoryError>>;
	findByFilters(filters: RouteFilters): Promise<Result<RouteEntity[], RepositoryError>>;
	create(data: CreateRouteData): Promise<Result<RouteEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
