import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { User, UserAttributes } from '../../models/user.model';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication token required. Provide Authorization: Bearer <token>',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'User account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    // Attach authenticated user to request
    req.user = user.get({ plain: true }) as UserAttributes;
    next();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({
      success: false,
      message: `Authentication failed: ${errMsg}`,
    });
  }
};

export const requireRoles = (allowedRoles: ('ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
};

