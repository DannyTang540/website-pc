export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  address?: Address;
  role: 'user' | 'admin';
  points: number;
  membership: 'bronze' | 'silver' | 'gold' | 'platinum' | 'none';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}