import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { initSocket } from './config/socket';
import { User } from './models/User';
import { seedDatabase } from './utils/seed';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Auto-seed if database is freshly started and has no users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Startup] No existing records found. Auto-seeding initial database...');
      await seedDatabase();
    }

    // 3. Create HTTP Server & initialize Socket.IO
    const server = http.createServer(app);
    initSocket(server);

    // 4. Start Listening
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 SUPERMARKET BACKEND RUNNING ON http://localhost:${PORT}`);
      console.log(`📡 Socket.IO Real-time Sync Ready`);
      console.log(`🔑 Default Logins:`);
      console.log(`   Admin:      admin / admin123`);
      console.log(`   Manager:    manager / manager123`);
      console.log(`   Cashier:    cashier / cashier123`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Startup Error] Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
