import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateTravelData, TravelEntity } from '../entities/travel.entity.js';

export type TravelFilters = {
	departureCity?: string;
	arrivalCity?: string;
	date?: Date;
};

export interface TravelRepository {
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TravelEntity[]; total: number }, RepositoryError>>;
	findById(id: string): Promise<Result<TravelEntity | null, RepositoryError>>;
	findByFilters(filters: TravelFilters): Promise<Result<TravelEntity[], RepositoryError>>;
	create(data: CreateTravelData): Promise<Result<TravelEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
