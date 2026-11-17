const bcrypt = require("bcryptjs");
const { User } = require("../../models/user.model");
class UserSetter {
  static SALT_ROUNDS = 10;
  static async hashPassword(password) {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  static async createUser(data) {
    const hashedPassword = await this.hashPassword(data.password);
    return User.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: data.role || "CASHIER",
      isActive: data.isActive !== void 0 ? data.isActive : true
    });
  }
  static async updateUser(id, data) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error(`User with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== void 0) user.name = data.name.trim();
    if (data.email !== void 0) user.email = data.email.trim().toLowerCase();
    if (data.role !== void 0) user.role = data.role;
    if (data.isActive !== void 0) user.isActive = data.isActive;
    await user.save();
    return user;
  }
  static async updatePassword(id, newPassword) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error(`User with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    user.password = await this.hashPassword(newPassword);
    await user.save();
  }
  static async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error(`User with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    await user.destroy();
    return true;
  }
}
module.exports = {
  UserSetter,
};
