import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
  user?: { id: number; role: string; username: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

let roleCache: Record<string, Record<string, string[]>> | null = null;
let cacheExpiration = 0;

async function getRolePermissionsMap() {
  const now = Date.now();
  if (roleCache && now < cacheExpiration) {
    return roleCache;
  }

  const roles = await prisma.role.findMany({
    include: { permissions: true }
  });

  const matrix: Record<string, Record<string, string[]>> = {};
  for (const role of roles) {
    matrix[role.name] = {};
    for (const perm of role.permissions) {
      if (!matrix[role.name][perm.domain]) {
        matrix[role.name][perm.domain] = [];
      }
      matrix[role.name][perm.domain].push(perm.action);
    }
  }

  roleCache = matrix;
  cacheExpiration = now + 5 * 60 * 1000; // Cache for 5 mins
  return matrix;
}

export const requirePermission = (domain: string, action: string | string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { role } = req.user;
      const rbacMatrix = await getRolePermissionsMap();
      const permissions = rbacMatrix[role] || {};
      const domainPerms = permissions[domain] || ["none"];

      if (domainPerms.includes("none")) {
        return res.status(403).json({ error: `Forbidden: No access to ${domain}` });
      }

      const allowedActions = Array.isArray(action) ? action : [action];
      
      const hasPermission = allowedActions.some(act => domainPerms.includes(act)) || domainPerms.includes("full");

      if (!hasPermission) {
        return res.status(403).json({ error: `Forbidden: Missing required permission for ${domain}` });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error checking permissions' });
    }
  };
};

export const requireAdmin = [authenticateToken, requirePermission('users', 'assign_roles')]; // Backwards compat alias for quick things
export const requireMemberOrAdmin = authenticateToken; // Let routes handle granular permissions
