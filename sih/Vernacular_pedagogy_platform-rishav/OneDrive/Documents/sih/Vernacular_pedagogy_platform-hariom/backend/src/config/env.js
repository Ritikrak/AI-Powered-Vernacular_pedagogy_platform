import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vernacular_classroom',
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'lokshiksha_vernacular_pedagogy_secure_jwt_secret_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '678831874585-demo.apps.googleusercontent.com',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  deepgramModel: process.env.DEEPGRAM_MODEL || 'nova-2',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  classroomDefaultRoom: process.env.CLASSROOM_DEFAULT_ROOM || 'main'
};

if (!env.geminiApiKey) {
  console.warn('⚠️  [CONFIG WARNING] GEMINI_API_KEY is not set. Multilingual translation & simplification will operate in high-fidelity offline/dictionary fallback mode.');
}

if (env.deepgramApiKey && env.deepgramApiKey.trim()) {
  const maskedKey = env.deepgramApiKey.trim().slice(0, 4) + '...' + env.deepgramApiKey.trim().slice(-4);
  console.log(`🎙️  [CONFIG] DEEPGRAM_API_KEY loaded from .env (${maskedKey}, model: ${env.deepgramModel})`);
} else {
  console.log('ℹ️  [CONFIG] DEEPGRAM_API_KEY is not set in .env. Live speech streaming will use resilient pedagogical simulation mode.');
}
