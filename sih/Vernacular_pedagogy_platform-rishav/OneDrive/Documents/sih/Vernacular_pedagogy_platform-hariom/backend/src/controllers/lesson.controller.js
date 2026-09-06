import pdfParse from 'pdf-parse';
import { isMongoConnected } from '../config/db.js';
import { Lesson, mockLessons } from '../models/Lesson.js';
import { Translation } from '../models/Translation.js';
import { geminiService } from '../services/gemini.service.js';
import { translationService } from '../services/translation.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export const lessonController = {
  /**
   * Get all lessons
   */
  async getLessons(req, res, next) {
    try {
      let lessons = mockLessons;
      if (isMongoConnected()) {
        try {
          const dbLessons = await Lesson.find().populate('translations').sort({ createdAt: -1 });
          if (dbLessons && dbLessons.length > 0) {
            lessons = dbLessons;
          }
        } catch {
          lessons = mockLessons;
        }
      }

      // Map to frontend expected shape: { id, title, source_text, source_language, translations }
      const formatted = lessons.map(item => ({
        id: item.id || item._id,
        _id: item._id,
        title: item.title,
        subject: item.subject,
        grade_level: item.gradeLevel,
        source_text: item.sourceText,
        source_language: item.sourceLanguage || 'Hindi',
        simplified_text: item.simplifiedText || '',
        translations: item.translations || []
      }));

      res.status(200).json(formatted);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload lesson file (PDF, TXT, MD) and extract text
   */
  async uploadLesson(req, res, next) {
    try {
      let extractedText = '';
      let title = req.body.title || '';
      const subject = req.body.subject || 'General Science';
      const gradeLevel = req.body.gradeLevel || 'Class 5';

      if (req.file) {
        const fileBuffer = req.file.buffer;
        const originalName = req.file.originalname;

        if (originalName.toLowerCase().endsWith('.pdf') || req.file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(fileBuffer);
          extractedText = pdfData.text || '';
        } else {
          // Text / markdown
          extractedText = fileBuffer.toString('utf-8');
        }

        if (!title) {
          title = originalName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        }
      } else if (req.body.sourceText) {
        extractedText = req.body.sourceText;
        if (!title) title = req.body.title || 'Untitled Lesson';
      } else {
        throw new ApiError(400, 'Please provide a file (PDF/TXT) or sourceText field');
      }

      extractedText = extractedText.trim();
      if (!extractedText) {
        throw new ApiError(400, 'Could not extract readable text from the provided source');
      }

      // Automatically simplify with Gemini AI
      const simplified = await geminiService.simplifyLesson(extractedText, gradeLevel, 'Hindi');

      let savedLesson;
      try {
        savedLesson = await Lesson.create({
          title,
          subject,
          gradeLevel,
          sourceText: extractedText,
          sourceLanguage: 'Hindi',
          simplifiedText: simplified,
          fileType: req.file ? (req.file.originalname.endsWith('.pdf') ? 'pdf' : 'txt') : 'manual',
          originalFileName: req.file?.originalname || '',
          createdBy: req.user?._id
        });
      } catch {
        savedLesson = {
          _id: `les_${Date.now()}`,
          id: Date.now(),
          title,
          subject,
          gradeLevel,
          sourceText: extractedText,
          sourceLanguage: 'Hindi',
          simplifiedText: simplified
        };
        mockLessons.unshift(savedLesson);
      }

      res.status(201).json({
        id: savedLesson.id || savedLesson._id,
        title: savedLesson.title,
        subject: savedLesson.subject,
        grade_level: savedLesson.gradeLevel,
        source_text: savedLesson.sourceText,
        source_language: savedLesson.sourceLanguage,
        simplified_text: savedLesson.simplifiedText
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single lesson by ID
   */
  async getLessonById(req, res, next) {
    try {
      const { id } = req.params;
      let lesson;
      try {
        lesson = await Lesson.findById(id).populate('translations');
      } catch {
        lesson = mockLessons.find(l => l.id == id || l._id === id);
      }

      if (!lesson) {
        lesson = mockLessons.find(l => l.id == id || l._id === id);
      }

      if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
      }

      res.status(200).json(lesson);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Simplify lesson text on-demand using Gemini AI
   */
  async simplify(req, res, next) {
    try {
      const { text, gradeLevel = 'Class 5', language = 'Hindi' } = req.body;
      if (!text) {
        throw new ApiError(400, 'Text to simplify is required');
      }

      const simplified = await geminiService.simplifyLesson(text, gradeLevel, language);
      res.status(200).json({
        original_text: text,
        grade_level: gradeLevel,
        simplified_text: simplified
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Translate a specific lesson to target language
   */
  async translateLesson(req, res, next) {
    try {
      const { id } = req.params;
      const { target_language } = req.body;

      if (!target_language) {
        throw new ApiError(400, 'target_language is required');
      }

      let lesson;
      try {
        lesson = await Lesson.findById(id);
      } catch {
        lesson = mockLessons.find(l => l.id == id || l._id === id);
      }

      if (!lesson) {
        lesson = mockLessons.find(l => l.id == id || l._id === id);
      }

      const textToTranslate = lesson ? lesson.sourceText : 'Lesson content';
      const translation = await translationService.translate(textToTranslate, target_language, 'Hindi');

      res.status(200).json({
        lesson_id: id,
        lesson_title: lesson?.title || '',
        language: target_language,
        translated_text: translation.translatedText,
        phonetic_text: translation.phoneticText,
        provider: translation.provider
      });
    } catch (error) {
      next(error);
    }
  }
};
