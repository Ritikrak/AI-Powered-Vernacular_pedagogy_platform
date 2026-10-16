import mongoose from 'mongoose';

const savedLessonSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: 'student-demo',
      index: true
    },
    lessonId: {
      type: String,
      required: true,
      index: true
    },
    lessonTitle: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// In-memory store for instant zero-latency access and dev fallback
const inMemorySaved = new Map();

function getStudentSavedSet(studentId = 'student-demo') {
  if (!inMemorySaved.has(studentId)) {
    inMemorySaved.set(studentId, new Set());
  }
  return inMemorySaved.get(studentId);
}

export const savedLessonStore = {
  save(studentId = 'student-demo', lessonId, lessonTitle = '') {
    const set = getStudentSavedSet(studentId);
    set.add(String(lessonId));
    return {
      success: true,
      studentId,
      lessonId,
      lessonTitle,
      savedAt: new Date()
    };
  },

  remove(studentId = 'student-demo', lessonId) {
    const set = getStudentSavedSet(studentId);
    set.delete(String(lessonId));
    return {
      success: true,
      studentId,
      lessonId,
      removed: true
    };
  },

  list(studentId = 'student-demo') {
    const set = getStudentSavedSet(studentId);
    const savedLessons = Array.from(set);
    return {
      studentId,
      total: savedLessons.length,
      savedLessons
    };
  },

  getAll(studentId = 'student-demo') {
    return this.list(studentId);
  }
};

export const SavedLesson = mongoose.models.SavedLesson || mongoose.model('SavedLesson', savedLessonSchema);
