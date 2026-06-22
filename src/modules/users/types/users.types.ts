export interface UserPublicResponse {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly role: string;
  readonly createdAt: string;
}

export interface UpdateUserInput {
  readonly name?: string;
  readonly avatarUrl?: string;
}

export interface PaginationInput {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly meta: PaginatedMeta;
}

export interface JwtUser {
  readonly sub: string;
  readonly email: string;
  readonly role: 'USER' | 'ADMIN';
}
