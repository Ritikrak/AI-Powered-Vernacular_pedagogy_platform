import express from 'express';
import authRoutes from './auth.routes.js';
import lessonRoutes from './lesson.routes.js';
import translationRoutes from './translation.routes.js';
import languageRoutes from './language.routes.js';
import classroomRoutes from './classroom.routes.js';
import { translationController } from '../controllers/translation.controller.js';
import { upload } from '../middleware/upload.js';
import { getDBStatus } from '../config/db.js';
import { geminiService } from '../services/gemini.service.js';

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

// Speech transcription shortcut /api/speech/transcribe
router.post('/speech/transcribe', upload.single('file'), translationController.transcribeAudio);

export default router;
