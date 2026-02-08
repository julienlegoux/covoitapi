import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { ColorEntity } from '../entities/color.entity.js';

export type CreateColorData = Omit<ColorEntity, 'id' | 'refId'>;
export type UpdateColorData = Partial<Omit<ColorEntity, 'id' | 'refId'>>;

export interface ColorRepository {
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: ColorEntity[]; total: number }, RepositoryError>>;
	findById(id: string): Promise<Result<ColorEntity | null, RepositoryError>>;
	findByName(name: string): Promise<Result<ColorEntity | null, RepositoryError>>;
	create(data: CreateColorData): Promise<Result<ColorEntity, RepositoryError>>;
	update(id: string, data: UpdateColorData): Promise<Result<ColorEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
