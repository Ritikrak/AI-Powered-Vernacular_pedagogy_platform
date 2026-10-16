import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Configure reliable DNS resolution on Windows to resolve 'querySrv ECONNREFUSED' with mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted sandboxes
}

let isConnected = false;
let isInMemoryFallback = false;

function sanitizeMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

export async function connectDB() {
  if (isConnected) return;

  const targetUri = env.mongodbUri;
  console.log(`⏳ [MONGODB] Connecting to database at: ${sanitizeMongoUri(targetUri)}...`);

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`✅ [MONGODB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    // If SRV lookup failed or network blocked SRV, try direct Atlas replica set endpoint if on same cluster
    const directAtlasFallback = 'mongodb://rritik345_db_user:rAoHZBTAJGCK6Fcq@ac-5prbow0-shard-00-00.xnfvhg2.mongodb.net:27017,ac-5prbow0-shard-00-01.xnfvhg2.mongodb.net:27017,ac-5prbow0-shard-00-02.xnfvhg2.mongodb.net:27017/vernacular-pedagogy?ssl=true&replicaSet=atlas-3hyjry-shard-0&authSource=admin&retryWrites=true&w=majority';
    if (targetUri.includes('vernacular-pedagogy.xnfvhg2.mongodb.net') && !targetUri.includes('ac-5prbow0-shard')) {
      try {
        console.log('🔄 [MONGODB] Retrying via direct Atlas replica set endpoint...');
        const conn = await mongoose.connect(directAtlasFallback, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        isConnected = true;
        isInMemoryFallback = false;
        console.log(`✅ [MONGODB] Connected successfully via direct replica set to: ${conn.connection.host}/${conn.connection.name}`);
        return;
      } catch (retryErr) {
        console.warn(`⚠️  [MONGODB WARNING] Direct replica set connection attempt failed: ${retryErr.message}`);
      }
    }

    console.warn(`⚠️  [MONGODB WARNING] Could not connect to MongoDB at ${sanitizeMongoUri(targetUri)}: ${error.message}`);
    console.log('ℹ️  [MONGODB] Operating in resilient fallback mode (in-memory mock store active for demo/offline resilience).');
    isInMemoryFallback = true;
    isConnected = false;
    mongoose.set('bufferCommands', false);
  }

  mongoose.connection.on('disconnected', () => {
    if (!isInMemoryFallback) {
      console.warn('⚠️  [MONGODB] Connection disconnected.');
      isConnected = false;
    }
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ [MONGODB] Connection reestablished.');
    isConnected = true;
  });
}

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDBStatus() {
  return {
    isConnected: isMongoConnected(),
    isInMemoryFallback: !isMongoConnected(),
    uri: isMongoConnected() ? sanitizeMongoUri(env.mongodbUri) : 'memory://resilient-fallback'
  };
}

