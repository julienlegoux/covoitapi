import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { BrandEntity, CreateBrandData } from '../entities/brand.entity.js';

export interface BrandRepository {
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: BrandEntity[]; total: number }, RepositoryError>>;
	findById(id: string): Promise<Result<BrandEntity | null, RepositoryError>>;
	create(data: CreateBrandData): Promise<Result<BrandEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
