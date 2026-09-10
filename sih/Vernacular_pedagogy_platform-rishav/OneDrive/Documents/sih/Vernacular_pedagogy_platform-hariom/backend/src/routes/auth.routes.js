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
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/resend-otp', authLimiter, authController.resendOtp);
router.post('/register', authLimiter, authController.register);
router.get('/me', verifyToken, authController.getMe);
router.post('/logout', authController.logout);

// Google OAuth 2.0 routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

export default router;

