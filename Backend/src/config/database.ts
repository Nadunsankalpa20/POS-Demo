import mongoose from 'mongoose';

let mongoMemoryServerInstance: any = null;

export const connectDatabase = async (): Promise<void> => {
  const targetUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.MONGO_PRIVATE_URL ||
    process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/supermarket_pos';
  const isCloudOrAtlas =
    targetUri.includes('mongodb+srv://') ||
    targetUri.includes('railway') ||
    Boolean(process.env.MONGODB_URI || process.env.MONGO_URL) ||
    process.env.NODE_ENV === 'production';

  try {
    // Cloud connections (Atlas) need longer timeout for initial TLS handshake
    const timeoutMs = isCloudOrAtlas ? 15000 : 3000;
    console.log(`[Database] Attempting to connect to: ${targetUri.replace(/:([^:@]{1,})@/, ':****@')}`);
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: timeoutMs,
    });
    console.log('[Database] Connected to external/cloud MongoDB successfully!');
    return;
  } catch (err: any) {
    console.warn(`[Database] MongoDB connection failed: ${err.message}`);

    // In production or when an explicit MONGODB_URI is provided, do NOT attempt in-memory fallback
    if (isCloudOrAtlas && process.env.NODE_ENV === 'production') {
      console.error('[Database] Failed to connect to production MongoDB. Please verify MONGODB_URI and Atlas Network Access (0.0.0.0/0).');
      throw err;
    }

    console.log('[Database] Starting built-in embedded MongoMemoryServer for standalone zero-config local execution...');

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
