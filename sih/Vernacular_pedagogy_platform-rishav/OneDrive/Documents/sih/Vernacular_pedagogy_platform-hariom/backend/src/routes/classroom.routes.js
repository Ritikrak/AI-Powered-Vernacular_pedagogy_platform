import express from 'express';
import { classroomController } from '../controllers/classroom.controller.js';

const router = express.Router();

router.get('/:room', classroomController.getRoomDetails);
router.get('/:room/transcripts', classroomController.getTranscripts);

export default router;
