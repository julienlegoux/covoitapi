export type RegisterInput = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  userId: string;
  token: string;
};
