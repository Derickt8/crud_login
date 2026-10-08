export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}
