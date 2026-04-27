import prisma from '../config/prisma';
import { env } from '../config/env';

export class UsersService {
  static async getUsers() {
    return await prisma.user.findMany({
      select: { id: true, username: true, email: true, registrationNumber: true, role: true }
    });
  }

  static async createUser(data: any) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new Error('Username already exists');

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new Error('Email already exists');

    if (data.registrationNumber) {
      const existingReg = await prisma.user.findUnique({ where: { registrationNumber: data.registrationNumber } });
      if (existingReg) throw new Error('Registration number already exists');
    }

    const { default: bcrypt } = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);
    return await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        registrationNumber: data.registrationNumber || null,
        passwordHash,
        role: data.role || 'MEMBER'
      },
      select: { id: true, username: true, email: true, registrationNumber: true, role: true }
    });
  }

  static async updateUser(id: number, data: any, requestingUserId: number) {
    const userToModify = await prisma.user.findUnique({ where: { id } });
    if (!userToModify) throw new Error('User not found');
    if (userToModify.username === env.ROOT_ADMIN_USERNAME && requestingUserId !== id) {
      throw new Error(`The '${env.ROOT_ADMIN_USERNAME}' master account is protected and cannot be edited by other users.`);
    }
    // Note: The 'admin' account can update its own password, but not its username/role.
    if (userToModify.username === env.ROOT_ADMIN_USERNAME && data.username && data.username !== env.ROOT_ADMIN_USERNAME) {
      throw new Error(`The '${env.ROOT_ADMIN_USERNAME}' username cannot be changed.`);
    }

    if (data.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== id) throw new Error('Username already belongs to someone else');
    }
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail && existingEmail.id !== id) throw new Error('Email already belongs to someone else');
    }
    if (data.registrationNumber) {
      const existingReg = await prisma.user.findUnique({ where: { registrationNumber: data.registrationNumber } });
      if (existingReg && existingReg.id !== id) throw new Error('Registration number already belongs to someone else');
    }

    const updateData: any = { ...data };
    if (data.password) {
      const { default: bcrypt } = await import('bcryptjs');
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, email: true, registrationNumber: true, role: true }
    });
  }

  static async assignRole(id: number, role: string, requestingUserId: number) {
    if (id === requestingUserId) throw new Error("You cannot change your own role.");
    
    const userToModify = await prisma.user.findUnique({ where: { id } });
    if (!userToModify) throw new Error('User not found');
    if (userToModify.username === env.ROOT_ADMIN_USERNAME) {
      throw new Error(`The '${env.ROOT_ADMIN_USERNAME}' master account's role cannot be modified.`);
    }

    const validRoles = ['ADMIN', 'INVENTORY_MANAGER', 'MEMBER'];
    if (!validRoles.includes(role)) throw new Error('Invalid role');
    return await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, email: true, registrationNumber: true, role: true }
    });
  }

  static async deleteUser(id: number, requestingUserId: number) {
    if (id === requestingUserId) throw new Error("You cannot delete your own account.");
    
    const userToModify = await prisma.user.findUnique({ where: { id } });
    if (!userToModify) throw new Error('User not found');
    if (userToModify.username === env.ROOT_ADMIN_USERNAME) {
      throw new Error(`The '${env.ROOT_ADMIN_USERNAME}' master account cannot be deleted.`);
    }

    return await prisma.user.delete({ where: { id } });
  }
}
