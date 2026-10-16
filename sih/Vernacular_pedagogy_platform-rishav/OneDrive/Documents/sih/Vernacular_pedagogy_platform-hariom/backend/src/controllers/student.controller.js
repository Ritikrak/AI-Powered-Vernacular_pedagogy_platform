import { preferenceStore } from '../models/StudentPreference.js';
import { savedLessonStore } from '../models/SavedLesson.js';
import { ApiError } from '../middleware/errorHandler.js';

export const studentController = {
  /**
   * Update student mother tongue: PUT /api/students/language
   * Body: { "language": "sat" }
   */
  async updateLanguage(req, res, next) {
    try {
      const studentId = req.user?.id || req.body.studentId || 'student-demo';
      const { language } = req.body;

      if (!language) {
        throw new ApiError(400, 'language is required');
      }

      const updated = preferenceStore.updateLanguage(studentId, language);
      res.status(200).json({
        success: true,
        message: 'Mother tongue updated successfully',
        studentId,
        language: updated.language,
        languageName: updated.languageName,
        autoPlay: updated.autoPlay
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update student preferences: PUT /api/students/preferences
   * Body: { "autoPlay": true }
   */
  async updatePreferences(req, res, next) {
    try {
      const studentId = req.user?.id || req.body.studentId || 'student-demo';
      const { autoPlay, language } = req.body;

      const updates = {};
      if (typeof autoPlay === 'boolean') updates.autoPlay = autoPlay;
      if (language) {
        const langResult = preferenceStore.updateLanguage(studentId, language);
        updates.language = langResult.language;
        updates.languageName = langResult.languageName;
      }

      const updated = preferenceStore.updatePreferences(studentId, updates);
      res.status(200).json({
        success: true,
        message: 'Student preferences updated successfully',
        studentId,
        language: updated.language,
        languageName: updated.languageName,
        autoPlay: updated.autoPlay
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get student preferences: GET /api/students/preferences
   */
  async getPreferences(req, res, next) {
    try {
      const studentId = req.user?.id || req.query.studentId || 'student-demo';
      const prefs = preferenceStore.get(studentId);
      res.status(200).json(prefs);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Save a lesson for offline study: POST /api/student/saved-lessons
   */
  async saveLesson(req, res, next) {
    try {
      const studentId = req.user?.id || req.body.studentId || 'student-demo';
      const { lessonId, lessonTitle } = req.body;

      if (!lessonId) {
        throw new ApiError(400, 'lessonId is required');
      }

      savedLessonStore.save(studentId, lessonId, lessonTitle);
      const currentList = savedLessonStore.list(studentId);
      res.status(201).json({
        success: true,
        message: 'Lesson saved for offline study',
        totalSaved: currentList.total,
        savedLessons: currentList.savedLessons
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a saved lesson: DELETE /api/student/saved-lessons/:lessonId
   */
  async removeSavedLesson(req, res, next) {
    try {
      const studentId = req.user?.id || req.body?.studentId || 'student-demo';
      const { lessonId } = req.params;

      if (!lessonId) {
        throw new ApiError(400, 'lessonId is required');
      }

      savedLessonStore.remove(studentId, lessonId);
      const currentList = savedLessonStore.list(studentId);
      res.status(200).json({
        success: true,
        message: 'Lesson removed from saved list',
        totalSaved: currentList.total,
        savedLessons: currentList.savedLessons
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all saved lessons: GET /api/student/saved-lessons
   */
  async getSavedLessons(req, res, next) {
    try {
      const studentId = req.user?.id || req.query.studentId || 'student-demo';
      const saved = savedLessonStore.list(studentId);
      res.status(200).json(saved);
    } catch (error) {
      next(error);
    }
  }
};
