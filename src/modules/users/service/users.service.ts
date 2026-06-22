import type { UsersRepository } from '../repository/users.repository.js';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type {
  JwtUser,
  PaginatedResult,
  PaginationInput,
  UpdateUserInput,
  UserPublicResponse,
} from '../types/users.types.js';

function toUserPublicResponse(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: Date;
}): UserPublicResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function makeUsersService(repository: UsersRepository) {
  async function listUsers(
    requestUser: JwtUser,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<UserPublicResponse>> {
    if (requestUser.role !== 'ADMIN') {
      throw new ForbiddenError();
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const { users, total } = await repository.findAll({ skip, take: pagination.limit });

    return {
      data: users.map(toUserPublicResponse),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async function getUserById(id: string): Promise<UserPublicResponse> {
    const user = await repository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return toUserPublicResponse(user);
  }

  async function updateUser(
    targetId: string,
    requestUser: JwtUser,
    data: UpdateUserInput,
  ): Promise<UserPublicResponse> {
    const isOwner = targetId === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    const user = await repository.findById(targetId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updated = await repository.update(targetId, data);
    return toUserPublicResponse(updated);
  }

  async function deleteUser(targetId: string, requestUser: JwtUser): Promise<void> {
    const isOwner = targetId === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    const user = await repository.findById(targetId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await repository.delete(targetId);
  }

  return { listUsers, getUserById, updateUser, deleteUser };
}
