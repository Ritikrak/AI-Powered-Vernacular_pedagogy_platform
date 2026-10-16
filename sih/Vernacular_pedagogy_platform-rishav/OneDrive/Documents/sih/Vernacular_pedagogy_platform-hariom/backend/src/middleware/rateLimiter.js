import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit login/register attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});
