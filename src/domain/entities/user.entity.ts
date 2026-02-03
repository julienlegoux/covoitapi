export type UserEntity = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserData = Omit<UserEntity, "id" | "createdAt" | "updatedAt">;
