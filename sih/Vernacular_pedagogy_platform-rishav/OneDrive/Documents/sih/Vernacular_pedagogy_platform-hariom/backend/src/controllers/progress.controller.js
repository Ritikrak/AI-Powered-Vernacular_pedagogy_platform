import { Progress, progressStore } from '../models/Progress.js';
import { isMongoConnected } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';

export const progressController = {
  /**
   * Track lesson progress: POST /api/progress
   * Body: { lessonId, progress }
   */
  async recordProgress(req, res, next) {
    try {
      const { lessonId, progress } = req.body;
      if (!lessonId) {
        throw new ApiError(400, 'lessonId is required');
      }

      const studentId = req.user?.id || req.body.studentId || 'student-demo';
      const record = progressStore.recordProgress(studentId, lessonId, progress);

      if (isMongoConnected()) {
        try {
          await Progress.findOneAndUpdate(
            { studentId, lessonId },
            {
              studentId,
              lessonId,
              progress: record.progress,
              status: record.status,
              completedAt: record.completedAt
            },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.warn('⚠️ [PROGRESS DB] Could not sync to Mongo:', dbErr.message);
        }
      }

      const summary = progressStore.getSummary(studentId);

      res.status(200).json({
        success: true,
        record,
        summary
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get progress dashboard metrics: GET /api/progress
   */
  async getProgressSummary(req, res, next) {
    try {
      const studentId = req.user?.id || req.query.studentId || 'student-demo';
      const summary = progressStore.getSummary(studentId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }
};
