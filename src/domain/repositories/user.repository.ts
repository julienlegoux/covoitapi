import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CreateUserData, UpdateUserData, UserEntity } from '../entities/user.entity.js';

export interface UserRepository {
	findAll(): Promise<Result<UserEntity[], RepositoryError>>;
	findById(id: string): Promise<Result<UserEntity | null, RepositoryError>>;
	findByEmail(email: string): Promise<Result<UserEntity | null, RepositoryError>>;
	create(data: CreateUserData): Promise<Result<UserEntity, RepositoryError>>;
	update(id: string, data: UpdateUserData): Promise<Result<UserEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
	existsByEmail(email: string): Promise<Result<boolean, RepositoryError>>;
}
