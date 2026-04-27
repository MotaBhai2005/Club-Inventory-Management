import { Request, Response } from 'express';
import { LendingSchema, BulkLendingSchema } from '../schemas/validation.schemas';
import { LendingsService } from '../services/lendings.service';
import { z } from 'zod';

export class LendingsController {
  static async getLendings(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 100);
      const lendings = await LendingsService.getLendings(user.id, user.role, { page, limit });
      res.json(lendings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async requestBorrow(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = LendingSchema.parse(req.body);
      const lending = await LendingsService.requestBorrow(user.id, data);
      res.json({ id: lending.id, status: lending.status });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      if (err.message === 'Item not found' || err.message === 'Not enough availability') return res.status(400).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async approveBorrow(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await LendingsService.approveBorrow(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async rejectBorrow(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await LendingsService.rejectBorrow(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createOnBehalf(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = LendingSchema.parse(req.body);
      const lending = await LendingsService.createOnBehalf(user.id, data);
      res.json({ id: lending.id, status: lending.status });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(400).json({ error: err.message });
    }
  }

  static async createBulkOnBehalf(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = BulkLendingSchema.parse(req.body);
      const results = await LendingsService.createBulkOnBehalf(user.id, data);
      res.json({ success: true, count: results.length });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(400).json({ error: err.message });
    }
  }

  static async returnLending(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await LendingsService.returnLending(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 200);
      const history = await LendingsService.getHistory({ page, limit });
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
