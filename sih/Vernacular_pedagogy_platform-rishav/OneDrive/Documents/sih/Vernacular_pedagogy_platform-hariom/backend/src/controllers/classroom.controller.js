import { classroomService } from '../services/classroom.service.js';

export const classroomController = {
  /**
   * Get active room details, teacher status, and connected students
   */
  async getRoomDetails(req, res, next) {
    try {
      const roomCode = req.params.room || 'main';
      const state = classroomService.getRoomState(roomCode);
      res.status(200).json(state);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent transcript feed for a room
   */
  async getTranscripts(req, res, next) {
    try {
      const roomCode = req.params.room || 'main';
      const state = classroomService.getRoomState(roomCode);
      res.status(200).json({
        roomCode,
        transcripts: state.recentTranscripts
      });
    } catch (error) {
      next(error);
    }
  }
};
