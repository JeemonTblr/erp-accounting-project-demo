const { User } = require("../../models/user.model");
class UserGetter {
  static sanitize(user) {
    const raw = user.get({ plain: true });
    const { password: _p, ...safe } = raw;
    return safe;
  }
  // Database fetch helpers
  static async fetchById(id) {
    const user = await User.findByPk(id);
    return user ? this.sanitize(user) : null;
  }
  static async fetchByEmail(email) {
    return User.findOne({ where: { email: email.trim().toLowerCase() } });
  }
  static async fetchAll() {
    const users = await User.findAll({
      order: [["id", "ASC"]]
    });
    return users.map((u) => this.sanitize(u));
  }
  // HTTP Request Handlers
  static async getAll(_req, res, next) {
    try {
      const users = await UserGetter.fetchAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid user ID" });
        return;
      }
      const user = await UserGetter.fetchById(id);
      if (!user) {
        res.status(404).json({ success: false, message: `User with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  static async getMe(req, res) {
    res.status(200).json({
      success: true,
      data: req.user
    });
  }
}
module.exports = {
  UserGetter,
};
