import express from 'express';
import { translationController } from '../controllers/translation.controller.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Translation endpoints
router.post('/', translationController.translateSingle);
router.post('/all', translationController.translateAll);
router.post('/speech', translationController.translateSpeech);

// Speech transcription endpoint (mapped under /speech or /translate)
router.post('/transcribe', upload.single('file'), translationController.transcribeAudio);

export default router;
