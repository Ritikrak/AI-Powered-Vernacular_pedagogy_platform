import express from 'express';
import { studentController } from '../controllers/student.controller.js';

const router = express.Router();

// Language & audio preferences
router.put('/language', studentController.updateLanguage);
router.put('/preferences', studentController.updatePreferences);
router.get('/preferences', studentController.getPreferences);

// Saved lessons / Offline study
router.post('/saved-lessons', studentController.saveLesson);
router.delete('/saved-lessons/:lessonId', studentController.removeSavedLesson);
router.get('/saved-lessons', studentController.getSavedLessons);

export default router;
