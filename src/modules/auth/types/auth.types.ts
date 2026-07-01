export interface RegisterInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface RefreshInput {
  readonly refreshToken: string;
}

export interface LogoutInput {
  readonly refreshToken: string;
}

export interface UserResponse {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: UserResponse;
}

export interface AuthTokensResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface ForgotPasswordInput {
  readonly email: string;
}

export interface ResetPasswordInput {
  readonly token: string;
  readonly newPassword: string;
}

export interface ChangePasswordInput {
  readonly currentPassword: string;
  readonly newPassword: string;
}
