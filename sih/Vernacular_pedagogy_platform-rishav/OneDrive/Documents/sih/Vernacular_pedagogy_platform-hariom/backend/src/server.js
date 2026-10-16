import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler, ApiError } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { setupClassroomSockets } from './sockets/classroom.socket.js';
import { setupDeepgramWebSocket } from './sockets/deepgram.socket.js';

// Initialize Express Application
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins for dev/testing or match env.corsOrigin
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 25000
});

// Configure Security & Core Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true
}));

app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all /api requests
app.use('/api', apiLimiter);

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'LokShiksha Vernacular Pedagogy Platform Backend',
    version: '1.0.0',
    description: 'Multilingual AI Education Engine for Jharkhand Classrooms',
    languages: ['Hindi', 'Santhali', 'Mundari', 'Ho', 'Kurukh', 'English'],
    docs: '/api/health'
  });
});

// Google OAuth root-level aliases (in case Google Console was set without /api prefix)
app.get('/auth/google', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(`/api/auth/google${query ? `?${query}` : ''}`);
});
app.get('/auth/google/callback', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(`/api/auth/google/callback${query ? `?${query}` : ''}`);
});

// Mount Main API Routes
app.use('/api', apiRouter);

// Setup Socket.IO Classroom Handlers
setupClassroomSockets(io);

// Setup Deepgram Realtime Audio Streaming WebSocket at /api/classroom/:roomId/deepgram
setupDeepgramWebSocket(server, io);

// 404 Handler for Unknown Routes
app.use((req, res, next) => {
  next(new ApiError(404, `Resource not found: ${req.method} ${req.originalUrl}`));
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server and Database Connection
async function startServer() {
  await connectDB();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [SERVER ERROR] Port ${env.port} is already in use by another process.`);
      console.error(`💡 Tip: Stop any existing running server on port ${env.port} or change PORT in backend/.env\n`);
    } else {
      console.error(`\n❌ [SERVER ERROR]:`, err.message || err);
    }
    process.exit(1);
  });

  server.listen(env.port, () => {
    console.log(`
===================================================================
🚀 LokShiksha Multilingual AI Pedagogy Backend Server
===================================================================
📡 HTTP Server:     http://localhost:${env.port}
🩺 Health Check:    http://localhost:${env.port}/api/health
🔌 Socket.IO:       ws://localhost:${env.port}/classroom
🎙️ Deepgram WS:     ws://localhost:${env.port}/api/classroom/:roomId/deepgram
🌍 Supported Dialects: Santhali, Mundari, Ho, Kurukh, Hindi, English
🤖 AI Engine:       Google Gemini 2.5 Flash + Vernacular Fallback
===================================================================
`);
  });
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 [SERVER] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('💤 [SERVER] HTTP and Socket server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 [SERVER] SIGINT received. Shutting down...');
  server.close(() => {
    console.log('💤 [SERVER] Process interrupted. Exit.');
    process.exit(0);
  });
});

startServer();

export { app, server, io };
