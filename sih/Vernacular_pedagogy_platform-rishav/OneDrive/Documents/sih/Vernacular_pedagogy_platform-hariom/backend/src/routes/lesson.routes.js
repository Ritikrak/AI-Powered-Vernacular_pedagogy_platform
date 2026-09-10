import express from 'express';
import { lessonController } from '../controllers/lesson.controller.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', lessonController.getLessons);
router.post('/upload', upload.single('file'), lessonController.uploadLesson);
router.get('/:id', lessonController.getLessonById);
router.post('/:id/complete', lessonController.completeLesson);
router.get('/:id/audio', lessonController.getLessonAudio);
router.post('/simplify', lessonController.simplify);
router.post('/:id/translations', lessonController.translateLesson);
router.get('/:id/translations/:targetLanguage', (req, res, next) => {
  req.body.target_language = req.params.targetLanguage;
  lessonController.translateLesson(req, res, next);
});

export default router;
