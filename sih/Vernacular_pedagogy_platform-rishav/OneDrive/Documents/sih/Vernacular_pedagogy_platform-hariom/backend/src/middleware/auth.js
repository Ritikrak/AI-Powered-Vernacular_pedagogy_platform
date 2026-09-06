import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './errorHandler.js';
import { User, mockUsers } from '../models/User.js';

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token missing or invalid format (Bearer required)');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    let user;
    try {
      user = await User.findById(decoded.id);
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
        name: decoded.name || 'User'
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
