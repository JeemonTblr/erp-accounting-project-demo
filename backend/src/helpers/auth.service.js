const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { config } = require("../config/env");
const { User } = require("../models/user.model");
class AuthService {
  static SALT_ROUNDS = 10;
  static async hashPassword(password) {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const signOptions = {
      expiresIn: config.jwt.expiresIn || "24h"
    };
    return jwt.sign(payload, config.jwt.secret, signOptions);
  }
  static sanitizeUser(user) {
    const raw = user.get({ plain: true });
    const { password: _pw, ...safeUser } = raw;
    return safeUser;
  }
  static async register(input) {
    const existingUser = await User.findOne({ where: { email: input.email.toLowerCase() } });
    if (existingUser) {
      const error = new Error(`A user with email "${input.email}" already exists.`);
      error.statusCode = 409;
      throw error;
    }
    const hashedPassword = await this.hashPassword(input.password);
    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      role: input.role || "CASHIER",
      isActive: true
    });
    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token
    };
  }
  static async login(input) {
    const user = await User.findOne({ where: { email: input.email.toLowerCase() } });
    if (!user) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated. Please contact an administrator.");
      error.statusCode = 403;
      throw error;
    }
    const isMatch = await this.comparePassword(input.password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }
    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token
    };
  }
  static async changePassword(userId, input) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    const isMatch = await this.comparePassword(input.currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("Current password is incorrect.");
      error.statusCode = 400;
      throw error;
    }
    const hashedPassword = await this.hashPassword(input.newPassword);
    user.password = hashedPassword;
    await user.save();
  }
  static async getUsers() {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["id", "ASC"]]
    });
    return users.map((u) => u.get({ plain: true }));
  }
  static async updateUserStatus(userId, isActive) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    user.isActive = isActive;
    await user.save();
    return this.sanitizeUser(user);
  }
  static async seedDefaultAdmin() {
    const adminEmail = "admin@textileshop.com";
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await this.hashPassword("Admin@123");
      await User.create({
        name: "Shop Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true
      });
      console.log("\u2705 Seeded default shop administrator: admin@textileshop.com");
    }
  }
}
module.exports = {
  AuthService,
};
