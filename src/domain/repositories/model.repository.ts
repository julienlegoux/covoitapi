import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateModelData, ModelEntity } from '../entities/model.entity.js';

export interface ModelRepository {
	findAll(): Promise<Result<ModelEntity[], RepositoryError>>;
	findById(id: string): Promise<Result<ModelEntity | null, RepositoryError>>;
	findByNameAndBrand(name: string, brandRefId: number): Promise<Result<ModelEntity | null, RepositoryError>>;
	create(data: CreateModelData): Promise<Result<ModelEntity, RepositoryError>>;
}
