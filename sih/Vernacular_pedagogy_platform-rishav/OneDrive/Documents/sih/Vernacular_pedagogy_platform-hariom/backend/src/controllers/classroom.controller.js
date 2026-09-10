import { classroomService } from '../services/classroom.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export const classroomController = {
  /**
   * Teacher creates room: POST /api/classrooms
   * Protected: Teacher only
   */
  async createRoom(req, res, next) {
    try {
      const teacherId = req.user?.id || req.user?._id || 'usr_teacher_01';
      const { roomCode, name, title, currentLesson, currentLanguage } = req.body;
      const room = await classroomService.createRoom(teacherId, {
        roomCode: roomCode || title,
        name: name || title || 'Vernacular Classroom',
        currentLesson,
        currentLanguage
      });

      res.status(201).json({
        success: true,
        message: 'Classroom created successfully',
        room
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Teacher starts classroom: POST /api/classrooms/:id/start
   * Protected: Teacher only
   */
  async startRoom(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const teacherId = req.user?.id || req.user?._id || 'usr_teacher_01';
      const room = await classroomService.startClassroom(roomCode, teacherId);

      res.status(200).json({
        success: true,
        message: `Classroom ${roomCode} started successfully`,
        room
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Teacher ends classroom: POST /api/classrooms/:id/end
   * Protected: Teacher only
   */
  async endRoom(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const teacherId = req.user?.id || req.user?._id || 'usr_teacher_01';
      const room = await classroomService.endClassroom(roomCode, teacherId);

      res.status(200).json({
        success: true,
        message: `Classroom ${roomCode} ended`,
        room
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Teacher broadcasts lesson: POST /api/classrooms/:id/broadcast
   * Protected: Teacher only
   */
  async broadcast(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const teacherId = req.user?.id || req.user?._id || 'usr_teacher_01';
      const { text, language = 'Hindi' } = req.body;

      if (!text) {
        throw new ApiError(400, 'text is required to broadcast');
      }

      const message = await classroomService.processTeacherSpeech(roomCode, text, language, teacherId);

      res.status(200).json({
        success: true,
        message: 'Lesson broadcast processed and translated',
        broadcast: message
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all active classrooms: GET /api/classrooms/active
   */
  async getActiveRooms(req, res, next) {
    try {
      const activeRooms = classroomService.getActiveRooms();
      res.status(200).json({
        total: activeRooms.length,
        rooms: activeRooms
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student joins classroom: POST /api/classrooms/:id/join
   * Protected: Student only
   */
  async joinRoom(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const studentData = {
        id: req.user?.id || req.user?._id || req.body.studentId || `std_${Date.now()}`,
        name: req.user?.name || req.body.name || 'Student',
        preferredLanguage: req.user?.preferredLanguage || req.body.preferredLanguage || 'Santhali'
      };

      const result = await classroomService.joinRoom(roomCode, studentData);

      res.status(200).json({
        success: true,
        message: `Joined classroom ${roomCode}`,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Leave classroom: POST /api/classrooms/:id/leave
   */
  async leaveRoom(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      res.status(200).json({
        success: true,
        message: `Left classroom ${roomCode}`,
        roomCode
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get room details & dynamic state: GET /api/classrooms/:room
   */
  async getRoomDetails(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const state = classroomService.getRoomState(roomCode);
      res.status(200).json(state);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get message history for translation log: GET /api/classrooms/:room/messages
   */
  async getMessages(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const data = classroomService.getMessages(roomCode);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get room transcripts: GET /api/classrooms/:room/transcripts
   */
  async getTranscripts(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const state = classroomService.getRoomState(roomCode);
      res.status(200).json({
        roomCode,
        transcripts: state.recentTranscripts || []
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Student asks question: POST /api/classrooms/:room/questions
   */
  async askQuestion(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const { text, language = 'sat', studentName } = req.body;
      const name = req.user?.name || studentName || 'Student';

      if (!text) {
        return res.status(400).json({ error: 'text is required' });
      }

      const question = await classroomService.addQuestion(roomCode, {
        studentName: name,
        text,
        language: req.user?.preferredLanguage || language
      });

      res.status(201).json({
        success: true,
        message: 'Question submitted and translated for teacher',
        question
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Teacher answers question: POST /api/classrooms/:room/answers
   */
  async answerQuestion(req, res, next) {
    try {
      const roomCode = req.params.id || req.params.room || 'MAIN';
      const { questionId, text } = req.body;
      if (!questionId || !text) {
        return res.status(400).json({ error: 'questionId and text are required' });
      }

      const answer = await classroomService.addAnswer(roomCode, {
        questionId,
        text
      });

      res.status(200).json({
        success: true,
        message: 'Answer submitted and translated for student',
        answer
      });
    } catch (error) {
      next(error);
    }
  }
};
