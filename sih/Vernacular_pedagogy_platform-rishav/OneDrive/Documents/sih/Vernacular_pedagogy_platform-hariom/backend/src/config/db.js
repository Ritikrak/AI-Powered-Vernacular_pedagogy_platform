import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;
let isInMemoryFallback = false;

// Disable Mongoose query buffering so operations don't block for 10s when MongoDB is offline
mongoose.set('bufferCommands', false);

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`✅ [MONGODB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`⚠️  [MONGODB WARNING] Could not connect to MongoDB at ${env.mongodbUri}: ${error.message}`);
    console.log('ℹ️  [MONGODB] Operating in resilient fallback mode (in-memory mock store active for demo/offline resilience).');
    isInMemoryFallback = true;
    isConnected = false;
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
    uri: isMongoConnected() ? env.mongodbUri : 'memory://resilient-fallback'
  };
}
