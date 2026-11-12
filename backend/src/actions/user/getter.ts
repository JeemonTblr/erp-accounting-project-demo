import { Request, Response, NextFunction } from 'express';
import { User, UserAttributes } from '../../models/user.model';

export class UserGetter {
  public static sanitize(user: User): Omit<UserAttributes, 'password'> {
    const raw = user.get({ plain: true }) as UserAttributes;
    const { password: _p, ...safe } = raw;
    return safe;
  }

  // Database fetch helpers
  public static async fetchById(id: number): Promise<Omit<UserAttributes, 'password'> | null> {
    const user = await User.findByPk(id);
    return user ? this.sanitize(user) : null;
  }

  public static async fetchByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  public static async fetchAll(): Promise<Omit<UserAttributes, 'password'>[]> {
    const users = await User.findAll({
      order: [['id', 'ASC']],
    });
    return users.map((u) => this.sanitize(u));
  }

  // HTTP Request Handlers
  public static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserGetter.fetchAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      const user = await UserGetter.fetchById(id);
      if (!user) {
        res.status(404).json({ success: false, message: `User with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  }
}

