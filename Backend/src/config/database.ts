import mongoose from 'mongoose';

let mongoMemoryServerInstance: any = null;

export const connectDatabase = async (): Promise<void> => {
  const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supermarket_pos';

  try {
    // Attempt standard connection with 2.5s timeout
    console.log(`[Database] Attempting to connect to: ${targetUri}`);
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('[Database] Connected to external MongoDB successfully!');
  } catch (err: any) {
    console.warn(`[Database] External MongoDB connection failed (${err.message}).`);
    console.log('[Database] Starting built-in embedded MongoMemoryServer for standalone zero-config execution...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'supermarket_pos',
        },
      });
      const inMemoryUri = mongoMemoryServerInstance.getUri();
      console.log(`[Database] Embedded MongoDB initialized at: ${inMemoryUri}`);

      await mongoose.connect(inMemoryUri);
      console.log('[Database] Connected to embedded MongoDB successfully!');
    } catch (memErr: any) {
      console.error('[Database] Failed to initialize embedded MongoDB:', memErr);
      throw memErr;
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose disconnected.');
  });
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};
