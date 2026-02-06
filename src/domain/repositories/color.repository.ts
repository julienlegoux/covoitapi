import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { ColorEntity } from '../entities/color.entity.js';

export interface ColorRepository {
	findAll(): Promise<Result<ColorEntity[], RepositoryError>>;
	findById(id: string): Promise<Result<ColorEntity | null, RepositoryError>>;
}
