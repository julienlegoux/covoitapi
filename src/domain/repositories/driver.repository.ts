import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CreateDriverData, DriverEntity } from '../entities/driver.entity.js';

export interface DriverRepository {
	findByUserId(userId: string): Promise<Result<DriverEntity | null, RepositoryError>>;
	create(data: CreateDriverData): Promise<Result<DriverEntity, RepositoryError>>;
}
