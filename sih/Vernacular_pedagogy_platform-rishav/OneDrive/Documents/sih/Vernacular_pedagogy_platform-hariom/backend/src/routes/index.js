import express from 'express';
import authRoutes from './auth.routes.js';
import lessonRoutes from './lesson.routes.js';
import translationRoutes from './translation.routes.js';
import languageRoutes from './language.routes.js';
import classroomRoutes from './classroom.routes.js';
import progressRoutes from './progress.routes.js';
import studentRoutes from './student.routes.js';
import { translationController } from '../controllers/translation.controller.js';
import { upload } from '../middleware/upload.js';
import { getDBStatus } from '../config/db.js';
import { geminiService } from '../services/gemini.service.js';

import { ttsService } from '../services/tts.service.js';

const router = express.Router();

// System Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vernacular Pedagogy API',
    version: '1.0.0',
    database: getDBStatus(),
    geminiConfigured: geminiService.isConfigured()
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/lessons', lessonRoutes);
router.use('/translate', translationRoutes);
router.use('/languages', languageRoutes);
router.use('/classroom', classroomRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/progress', progressRoutes);
router.use('/student', studentRoutes);
router.use('/students', studentRoutes);

// Speech routes: transcribe & generate & stream proxy
router.post('/speech/transcribe', upload.single('file'), translationController.transcribeAudio);

router.post('/speech/generate', async (req, res, next) => {
  try {
    const { text, language = 'Hindi', phonetic = '' } = req.body;
    if (!text && !phonetic) {
      return res.status(400).json({ error: 'text or phonetic is required' });
    }
    const tts = await ttsService.synthesize(text, language, phonetic);
    res.status(200).json({
      success: true,
      audioUrl: tts.audioUrl,
      text: tts.text,
      phonetic: tts.phonetic,
      language: tts.language,
      voiceLang: tts.voiceLang,
      provider: tts.provider
    });
  } catch (error) {
    next(error);
  }
});

// Resilient Audio Stream Proxy (Eliminates CORS, 404, & browser Referer blocks)
router.get('/speech/audio-stream', async (req, res) => {
  try {
    const { text = '', language = 'Hindi', phonetic = '' } = req.query;
    const cleanPhonetic = String(phonetic || '').trim();
    const cleanText = String(text || '').replace(/[\n\r]+/g, ' ').slice(0, 300).trim();

    const isTribalScript = /[\u1C50-\u1C7F\u{118A0}-\u{118FF}\u{1E5D0}-\u{1E5FF}]/u.test(cleanText);
    let toSpeak = (isTribalScript && cleanPhonetic) ? cleanPhonetic : (cleanPhonetic || cleanText);

    if (!toSpeak) {
      toSpeak = 'Tehen do abo dare nari babat bon seraya';
    }

    let voiceLang = 'hi';
    if (String(language).toLowerCase() === 'english') voiceLang = 'en';

    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${voiceLang}&client=tw-ob&q=${encodeURIComponent(toSpeak)}`;

    const response = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch audio stream' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error('❌ [AUDIO STREAM ERROR]:', error);
    return res.status(500).json({ error: 'Audio streaming error' });
  }
});

export default router;
