import bcrypt from 'bcryptjs';
import { User, UserAttributes } from '../../models/user.model';

export class UserSetter {
  private static readonly SALT_ROUNDS = 10;

  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
    isActive?: boolean;
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(data.password);
    return User.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: data.role || 'CASHIER',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  public static async updateUser(
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
      isActive?: boolean;
    }
  ): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error(`User with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.email !== undefined) user.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await user.save();
    return user;
  }

  public static async updatePassword(id: number, newPassword: string): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error(`User with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    user.password = await this.hashPassword(newPassword);
    await user.save();
  }

  public static async deleteUser(id: number): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error(`User with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    await user.destroy();
    return true;
  }
}

