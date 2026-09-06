import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// One-click demo login (accessible by both teacher and student)
router.post('/demo', authLimiter, authController.demoLogin);
router.post('/demo-login', authLimiter, authController.demoLogin);

// Standard auth
router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.get('/me', verifyToken, authController.getMe);

// OAuth mock redirect for Google
router.get('/google', (req, res) => {
  res.redirect(`${req.headers.referer || 'http://localhost:5173'}/dashboard?google_oauth=demo`);
});

export default router;
