import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateDriverData, DriverEntity } from '../entities/driver.entity.js';

export interface DriverRepository {
	findByUserRefId(userRefId: number): Promise<Result<DriverEntity | null, RepositoryError>>;
	create(data: CreateDriverData): Promise<Result<DriverEntity, RepositoryError>>;
}
