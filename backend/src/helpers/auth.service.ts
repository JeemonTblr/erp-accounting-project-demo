import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { User, UserAttributes } from '../models/user.model';
import { RegisterInput, LoginInput, ChangePasswordInput } from './validations/auth.validation';
import { JwtPayload } from './middleware/auth.middleware';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static generateToken(user: Pick<UserAttributes, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const signOptions: SignOptions = {
      expiresIn: (config.jwt.expiresIn || '24h') as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, config.jwt.secret, signOptions);
  }

  public static sanitizeUser(user: User): Omit<UserAttributes, 'password'> {
    const raw = user.get({ plain: true }) as UserAttributes;
    const { password: _pw, ...safeUser } = raw;
    return safeUser;
  }

  public static async register(input: RegisterInput): Promise<{
    user: Omit<UserAttributes, 'password'>;
    token: string;
  }> {
    const existingUser = await User.findOne({ where: { email: input.email.toLowerCase() } });
    if (existingUser) {
      const error = new Error(`A user with email "${input.email}" already exists.`);
      (error as unknown as { statusCode: number }).statusCode = 409;
      throw error;
    }

    const hashedPassword = await this.hashPassword(input.password);
    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      role: (input.role as 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF') || 'CASHIER',
      isActive: true,
    });

    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  public static async login(input: LoginInput): Promise<{
    user: Omit<UserAttributes, 'password'>;
    token: string;
  }> {
    const user = await User.findOne({ where: { email: input.email.toLowerCase() } });
    if (!user) {
      const error = new Error('Invalid email or password.');
      (error as unknown as { statusCode: number }).statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your account has been deactivated. Please contact an administrator.');
      (error as unknown as { statusCode: number }).statusCode = 403;
      throw error;
    }

    const isMatch = await this.comparePassword(input.password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      (error as unknown as { statusCode: number }).statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  public static async changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    const isMatch = await this.comparePassword(input.currentPassword, user.password);
    if (!isMatch) {
      const error = new Error('Current password is incorrect.');
      (error as unknown as { statusCode: number }).statusCode = 400;
      throw error;
    }

    const hashedPassword = await this.hashPassword(input.newPassword);
    user.password = hashedPassword;
    await user.save();
  }

  public static async getUsers(): Promise<Omit<UserAttributes, 'password'>[]> {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
    });
    return users.map((u) => u.get({ plain: true }) as Omit<UserAttributes, 'password'>);
  }

  public static async updateUserStatus(
    userId: number,
    isActive: boolean
  ): Promise<Omit<UserAttributes, 'password'>> {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    user.isActive = isActive;
    await user.save();
    return this.sanitizeUser(user);
  }

  public static async seedDefaultAdmin(): Promise<void> {
    const adminEmail = 'admin@textileshop.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const hashedPassword = await this.hashPassword('Admin@123');
      await User.create({
        name: 'Shop Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      });
      console.log('✅ Seeded default shop administrator: admin@textileshop.com');
    }
  }
}
