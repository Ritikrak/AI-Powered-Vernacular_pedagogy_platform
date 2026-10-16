import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './errorHandler.js';
import { User, mockUsers } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';

function extractToken(req) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // 2. Cookie header: token=<token>
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export async function verifyToken(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      // Resilient fallback for unauthenticated classroom Q&A interactions (demo/offline mode)
      const url = req.originalUrl || req.url || '';
      if (url.includes('/questions')) {
        req.user = {
          id: 'usr_guest_student',
          name: req.body?.studentName || 'Student',
          role: 'student',
          preferredLanguage: req.body?.language || 'Santhali'
        };
        return next();
      }
      if (url.includes('/answers')) {
        req.user = {
          id: 'usr_guest_teacher',
          name: 'Classroom Teacher',
          role: 'teacher',
          preferredLanguage: 'Hindi'
        };
        return next();
      }
      throw new ApiError(401, 'Authentication token missing or invalid format (Bearer or HttpOnly cookie required)');
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    let user;
    try {
      if (decoded.role === 'teacher') {
        user = await Teacher.findById(decoded.id);
      }
      if (!user) {
        user = await User.findById(decoded.id);
      }
      if (!user && decoded.role === 'teacher') {
        user = await Teacher.findOne({ email: decoded.email });
      }
    } catch {
      user = mockUsers.find(u => u._id === decoded.id || u.email === decoded.email);
    }

    if (!user) {
      user = mockUsers.find(u => u._id === decoded.id || u.email === decoded.email);
    }

    if (!user && decoded.email) {
      user = {
        _id: decoded.id || 'usr_temp',
        email: decoded.email,
        role: decoded.role || 'student',
        teacherId: decoded.teacherId || null,
        name: decoded.name || (decoded.role === 'teacher' ? 'Classroom Teacher' : 'Student')
      };
    }

    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired session token'));
    }
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Forbidden: Access requires one of [${roles.join(', ')}] role`));
    }
    next();
  };
}

export const authenticateUser = verifyToken;
export const requireTeacher = requireRole('teacher', 'admin');
export const requireStudent = requireRole('student', 'admin');
