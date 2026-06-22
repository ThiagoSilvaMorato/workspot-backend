import type { PrismaClient, User } from '@prisma/client';

export interface UpdateUserData {
  readonly name?: string;
  readonly avatarUrl?: string;
}

export interface FindAllOptions {
  readonly skip: number;
  readonly take: number;
}

export interface UsersRepository {
  findAll(options: FindAllOptions): Promise<{ users: User[]; total: number }>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}

export function makeUsersRepository(prisma: PrismaClient): UsersRepository {
  return {
    async findAll(options) {
      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({ skip: options.skip, take: options.take, orderBy: { createdAt: 'desc' } }),
        prisma.user.count(),
      ]);
      return { users, total };
    },

    findById(id) {
      return prisma.user.findUnique({ where: { id } });
    },

    update(id, data) {
      return prisma.user.update({ where: { id }, data });
    },

    async delete(id) {
      await prisma.user.delete({ where: { id } });
    },
  };
}
