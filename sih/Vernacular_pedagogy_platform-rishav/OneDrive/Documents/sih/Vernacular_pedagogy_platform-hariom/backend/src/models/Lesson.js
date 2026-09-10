import mongoose from 'mongoose';
import { CURRICULUM_STORIES } from '../data/curriculumStories.js';

const lessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String,
      unique: true,
      sparse: true
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: 200
    },
    subject: {
      type: String,
      default: 'General Science'
    },
    class: {
      type: Number,
      default: 5
    },
    gradeLevel: {
      type: String,
      default: 'Class 5'
    },
    description: {
      type: String,
      default: ''
    },
    availableLanguages: {
      type: [String],
      default: ['English', 'Hindi', 'Santhali', 'Mundari', 'Ho', 'Kurukh']
    },
    audioAvailable: {
      type: Boolean,
      default: true
    },
    sourceText: {
      type: String,
      required: [true, 'Source content is required']
    },
    sourceLanguage: {
      type: String,
      default: 'Hindi'
    },
    simplifiedText: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'markdown', 'manual'],
      default: 'manual'
    },
    originalFileName: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    translations: [
      {
        language: String,
        translated_text: String,
        phonetic_text: String
      }
    ]
  },
  {
    timestamps: true
  }
);

export const mockLessons = CURRICULUM_STORIES.map((item, idx) => {
  const customId = `lesson-${idx + 101}`;
  const rawId = item._id || item.id || `les-pdf-${String(idx + 1).padStart(2, '0')}`;
  return {
    _id: rawId,
    id: customId,
    rawId,
    title: item.title,
    subject: item.subject?.includes('Moral') ? 'Moral Stories' : item.subject || 'General Science',
    class: 5,
    gradeLevel: item.gradeLevel || 'Class 5',
    description: item.simplifiedText ? item.simplifiedText.slice(0, 120) + '...' : `Curriculum chapter on ${item.title}`,
    availableLanguages: ['English', 'Hindi', 'Santhali', 'Mundari', 'Ho', 'Kurukh'],
    audioAvailable: true,
    sourceText: item.sourceText,
    sourceLanguage: item.sourceLanguage || 'Hindi',
    simplifiedText: item.simplifiedText || '',
    translations: item.translations || []
  };
});

export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
