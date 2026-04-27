import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';

export class AuthService {
  static async signup(data: any) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new Error('Username already exists');

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new Error('Email already exists');

    if (data.registrationNumber) {
      const existingReg = await prisma.user.findUnique({ where: { registrationNumber: data.registrationNumber } });
      if (existingReg) throw new Error('Registration number already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { 
        username: data.username, 
        email: data.email, 
        registrationNumber: data.registrationNumber || null,
        passwordHash, 
        role: data.role || 'MEMBER'
      }
    });

    return user;
  }

  static async login(data: any) {
    const user = await prisma.user.findUnique({ where: { username: data.username } });
    
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { token, role: user.role };
  }

  static async oauthLogin(data: any) {
    let user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      // Create user if not exists
      const randomPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const username = data.name ? data.name.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substring(2, 5) : data.email.split('@')[0];
      
      user = await prisma.user.create({
        data: {
          username,
          email: data.email,
          passwordHash,
          role: 'MEMBER'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { token, role: user.role, username: user.username };
  }
}
