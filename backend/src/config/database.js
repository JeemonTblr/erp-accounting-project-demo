const { Sequelize } = require("sequelize");
const { config } = require("./env");
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "mariadb",
    dialectOptions: {
      connectTimeout: 1e4
    },
    pool: {
      max: config.db.pool.max,
      min: config.db.pool.min,
      acquire: config.db.pool.acquire,
      idle: config.db.pool.idle
    },
    logging: config.env === "development" ? (msg) => {
      if (!msg.includes("SHOW FULL TABLES") && !msg.includes("SELECT 1+1")) {
        console.log(`[Sequelize] ${msg}`);
      }
    } : false,
    define: {
      underscored: true,
      timestamps: true
    }
  }
);
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    const [result] = await sequelize.query("SELECT VERSION() as version");
    const version = result?.[0]?.version || "Unknown MariaDB Version";
    return {
      success: true,
      message: "Successfully connected to MariaDB.",
      version
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to connect to MariaDB: ${errMsg}`
    };
  }
};
module.exports = {
  sequelize,
  testDbConnection,
};
