import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CarEntity, CreateCarData, UpdateCarData } from '../entities/car.entity.js';

export interface CarRepository {
	findAll(): Promise<Result<CarEntity[], RepositoryError>>;
	findById(id: string): Promise<Result<CarEntity | null, RepositoryError>>;
	create(data: CreateCarData): Promise<Result<CarEntity, RepositoryError>>;
	update(id: string, data: UpdateCarData): Promise<Result<CarEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
	existsByImmat(immat: string): Promise<Result<boolean, RepositoryError>>;
}
