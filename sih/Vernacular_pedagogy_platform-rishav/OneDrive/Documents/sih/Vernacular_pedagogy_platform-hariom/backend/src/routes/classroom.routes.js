import express from 'express';
import { classroomController } from '../controllers/classroom.controller.js';
import { authenticateUser, requireTeacher, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// Active classrooms list (public / authenticated)
router.get('/active', classroomController.getActiveRooms);

// Teacher room management
router.post('/', authenticateUser, requireTeacher, classroomController.createRoom);
router.post('/:id/start', authenticateUser, requireTeacher, classroomController.startRoom);
router.post('/:id/end', authenticateUser, requireTeacher, classroomController.endRoom);
router.post('/:id/broadcast', authenticateUser, requireTeacher, classroomController.broadcast);
router.post('/:room/answers', authenticateUser, requireTeacher, classroomController.answerQuestion);

// Student room actions
router.post('/:id/join', authenticateUser, requireStudent, classroomController.joinRoom);
router.post('/:id/leave', authenticateUser, classroomController.leaveRoom);
router.post('/:room/questions', authenticateUser, requireStudent, classroomController.askQuestion);

// Room details and transcript / message history
router.get('/:room/messages', classroomController.getMessages);
router.get('/:room/transcripts', classroomController.getTranscripts);
router.get('/:room', classroomController.getRoomDetails);

export default router;
