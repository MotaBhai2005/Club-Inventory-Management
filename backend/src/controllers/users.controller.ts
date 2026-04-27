import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { UserSchema, UserUpdateSchema } from '../schemas/validation.schemas';
import { z } from 'zod';

export class UsersController {
  static async getUsers(req: Request, res: Response) {
    try {
      const users = await UsersService.getUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const data = UserSchema.parse(req.body);
      const user = await UsersService.createUser(data);
      res.json(user);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(400).json({ error: err.message });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const requestingUserId = (req as any).user.id;
      const data = UserUpdateSchema.parse(req.body);
      const user = await UsersService.updateUser(id, data, requestingUserId);
      res.json(user);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(400).json({ error: err.message });
    }
  }

  static async assignRole(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const requestingUserId = (req as any).user.id;
      const { role } = req.body;
      const user = await UsersService.assignRole(id, role, requestingUserId);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const requestingUserId = (req as any).user.id;
      await UsersService.deleteUser(id, requestingUserId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
