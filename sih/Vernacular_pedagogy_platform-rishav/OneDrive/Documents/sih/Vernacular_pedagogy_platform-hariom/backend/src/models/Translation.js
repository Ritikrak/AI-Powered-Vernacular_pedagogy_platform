import mongoose from 'mongoose';

const translationSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: false,
      index: true
    },
    sourceText: {
      type: String,
      required: true
    },
    sourceLanguage: {
      type: String,
      default: 'Hindi'
    },
    targetLanguage: {
      type: String,
      required: true,
      enum: ['Santhali', 'Mundari', 'Ho', 'Kurukh', 'Hindi', 'English'],
      index: true
    },
    nativeScriptText: {
      type: String,
      required: true
    },
    phoneticText: {
      type: String,
      default: ''
    },
    simplifiedText: {
      type: String,
      default: ''
    },
    audioBase64: {
      type: String,
      default: null
    },
    provider: {
      type: String,
      enum: ['gemini', 'dictionary-fallback', 'offline-mesh'],
      default: 'gemini'
    }
  },
  {
    timestamps: true
  }
);

export const Translation = mongoose.models.Translation || mongoose.model('Translation', translationSchema);
