import express from 'express';
import { progressController } from '../controllers/progress.controller.js';

const router = express.Router();

router.post('/', progressController.recordProgress);
router.get('/', progressController.getProgressSummary);

export default router;
