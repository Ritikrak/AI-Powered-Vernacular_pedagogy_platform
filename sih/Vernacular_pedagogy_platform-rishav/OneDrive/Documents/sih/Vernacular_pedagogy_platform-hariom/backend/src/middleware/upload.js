import multer from 'multer';
import { ApiError } from './errorHandler.js';

// Memory storage keeps files in buffer for direct processing (PDF parsing or audio base64)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'audio/webm',
    'audio/wav',
    'audio/mpeg',
    'audio/ogg',
    'audio/mp4'
  ];

  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt|md|webm|wav|mp3|ogg)$/i)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported file format: ${file.mimetype}. Allowed: PDF, TXT, MD, WEBM, WAV, MP3.`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max limit
  }
});
