import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserSetter } from './setter';
import { UserGetter } from './getter';
import { config } from '../../config/env';
import { User } from '../../models/user.model';

export class UserController {
  private static generateToken(user: { id: number; email: string; role: string }): string {
    const signOptions: SignOptions = {
      expiresIn: (config.jwt.expiresIn || '24h') as SignOptions['expiresIn'],
    };
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      signOptions
    );
  }

  // Add (Create) User
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      const userCount = await User.count();
      if (userCount > 0) {
        if (!req.user || req.user.role !== 'ADMIN') {
          res.status(403).json({
            success: false,
            message: 'Forbidden: Only administrators can add new user accounts.',
          });
          return;
        }
      }

      const existing = await UserGetter.fetchByEmail(email);
      if (existing) {
        res.status(409).json({
          success: false,
          message: `User with email "${email}" already exists.`,
        });
        return;
      }

      const newUser = await UserSetter.createUser({
        name,
        email,
        password,
        role: userCount === 0 ? 'ADMIN' : role,
      });

      const token = UserController.generateToken(newUser);
      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: {
          user: UserGetter.sanitize(newUser),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  //jeemon 
  // User Login
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await UserGetter.fetchByEmail(email);

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact an administrator.',
        });
        return;
      }

      const isMatch = await UserSetter.comparePassword(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const token = UserController.generateToken(user);
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: UserGetter.sanitize(user),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update User
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const updated = await UserSetter.updateUser(id, req.body);
      res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: UserGetter.sanitize(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  // Change Password
  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await UserSetter.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }

      await UserSetter.updatePassword(req.user.id, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete User
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      if (req.user && req.user.id === id) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own administrative account.',
        });
        return;
      }

      await UserSetter.deleteUser(id);
      res.status(200).json({
        success: true,
        message: `User with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

