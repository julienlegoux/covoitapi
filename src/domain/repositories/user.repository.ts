import type { CreateUserData, UserEntity } from "../entities/user.entity.js";

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  existsByEmail(email: string): Promise<boolean>;
}
