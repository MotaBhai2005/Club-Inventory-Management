import { Request, Response } from 'express';
import { ItemSchema } from '../schemas/validation.schemas';
import { InventoryService } from '../services/inventory.service';
import { z } from 'zod';

export class InventoryController {
  static async getInventory(req: Request, res: Response) {
    try {
      const inventory = await InventoryService.getInventory();
      res.json(inventory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async addItem(req: Request, res: Response) {
    try {
      const data = ItemSchema.parse(req.body);
      const item = await InventoryService.addItem(data);
      res.json(item);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(500).json({ error: err.message });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = ItemSchema.parse(req.body);
      await InventoryService.updateItem(id, data);
      res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteItem(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await InventoryService.deleteItem(id);
      res.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Cannot delete item currently lent out') return res.status(400).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
}
