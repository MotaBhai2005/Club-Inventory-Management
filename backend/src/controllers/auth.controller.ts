import { Request, Response } from 'express';
import { UserSchema } from '../schemas/validation.schemas';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { username, password, email, registrationNumber, role } = UserSchema.parse(req.body);
      await AuthService.signup({ username, password, email, registrationNumber, role });
      res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      if (err.message === 'Username already exists') return res.status(400).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login({ username, password });
      res.json(result);
    } catch (err: any) {
      if (err.message === 'Invalid credentials') return res.status(401).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  static async oauthLogin(req: Request, res: Response) {
    try {
      const { email, name } = req.body;
      const result = await AuthService.oauthLogin({ email, name });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
