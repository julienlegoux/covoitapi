import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CityEntity, CreateCityData } from '../entities/city.entity.js';

export interface CityRepository {
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CityEntity[]; total: number }, RepositoryError>>;
	findById(id: string): Promise<Result<CityEntity | null, RepositoryError>>;
	findByCityName(name: string): Promise<Result<CityEntity | null, RepositoryError>>;
	create(data: CreateCityData): Promise<Result<CityEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
