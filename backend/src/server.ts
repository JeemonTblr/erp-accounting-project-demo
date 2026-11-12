import app from './app';
import { config } from './config/env';
import { testDbConnection, sequelize } from './config/database';
import { initDatabase } from './models';
import { AuthService } from './helpers/auth.service';

const startServer = async (): Promise<void> => {
  try {
    console.log('='.repeat(65));
    console.log(' Clothing & Textiles Shop Management System - Backend API');
    console.log('='.repeat(65));

    // Test MariaDB database connection
    console.log(`Connecting to MariaDB database: "${config.db.name}" at ${config.db.host}:${config.db.port}...`);
    const dbTest = await testDbConnection();

    if (!dbTest.success) {
      console.error(`❌ MariaDB Connection Failed: ${dbTest.message}`);
      process.exit(1);
    }

    console.log(`✅ MariaDB Connection Established! (${dbTest.version})`);

    // Verify and ensure database tables exist
    await initDatabase();
    console.log('✅ Sequelize models and MariaDB tables ready.');

    // Seed default administrator if not present
    await AuthService.seedDefaultAdmin();

    // Start Express HTTP server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running in [${config.env}] mode on http://localhost:${config.port}`);
      console.log(`📡 Health Check:     http://localhost:${config.port}/api/health`);
      console.log(`🗄️  Database Test:    http://localhost:${config.port}/api/database/test`);
      console.log(`📋 Database Tables:  http://localhost:${config.port}/api/database/tables`);
      console.log(`🔐 Auth Endpoints:   http://localhost:${config.port}/api/auth/login`);
      console.log('='.repeat(65));
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully closing HTTP server and MariaDB pool...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('✅ MariaDB connection pool closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during MariaDB pool closure:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
