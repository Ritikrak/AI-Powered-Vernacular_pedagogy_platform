import { SavedLesson, savedLessonStore } from '../models/SavedLesson.js';
import { isMongoConnected } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';

export const savedLessonController = {
  /**
   * Save a lesson for offline study: POST /api/student/saved-lessons
   */
  async saveLesson(req, res, next) {
    try {
      const { lessonId, lessonTitle } = req.body;
      if (!lessonId) {
        throw new ApiError(400, 'lessonId is required');
      }

      const studentId = req.user?.id || req.body.studentId || 'student-demo';
      const result = savedLessonStore.save(studentId, lessonId, lessonTitle);

      if (isMongoConnected()) {
        try {
          await SavedLesson.findOneAndUpdate(
            { studentId, lessonId },
            { studentId, lessonId, lessonTitle },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.warn('⚠️ [SAVED LESSON DB] Could not sync to Mongo:', dbErr.message);
        }
      }

      const currentList = savedLessonStore.list(studentId);

      res.status(201).json({
        success: true,
        message: 'Lesson saved for offline study',
        data: result,
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
      const { lessonId } = req.params;
      if (!lessonId) {
        throw new ApiError(400, 'lessonId is required');
      }

      const studentId = req.user?.id || req.query.studentId || 'student-demo';
      savedLessonStore.remove(studentId, lessonId);

      if (isMongoConnected()) {
        try {
          await SavedLesson.deleteOne({ studentId, lessonId });
        } catch (dbErr) {
          console.warn('⚠️ [SAVED LESSON DB] Could not delete from Mongo:', dbErr.message);
        }
      }

      const currentList = savedLessonStore.list(studentId);

      res.status(200).json({
        success: true,
        message: 'Lesson removed from saved list',
        lessonId,
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
      const list = savedLessonStore.list(studentId);
      res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }
};
