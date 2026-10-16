import mongoose from 'mongoose';
import { mockLessons } from './Lesson.js';

const progressSchema = new mongoose.Schema(
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
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['completed', 'in_progress', 'not_started'],
      default: 'not_started'
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-seed baseline realistic in-memory progress: 8 Completed, 3 In Progress, 4 Not Started
const inMemoryProgress = new Map();

function initDefaultProgress(studentId = 'student-demo') {
  if (inMemoryProgress.has(studentId)) return inMemoryProgress.get(studentId);

  const studentMap = new Map();
  mockLessons.forEach((lesson, index) => {
    let status = 'not_started';
    let progress = 0;
    let completedAt = null;

    // 8 Completed (indexes 3 to 10 -> lesson-104 to lesson-111)
    // 3 In Progress (indexes 0 to 2 -> lesson-101 to lesson-103, with lesson-101 at 75%)
    // 4 Not Started (indexes 11 to 14 -> lesson-112 to lesson-115)
    if (index >= 3 && index < 11) {
      status = 'completed';
      progress = 100;
      completedAt = new Date(Date.now() - (index - 2) * 86400000);
    } else if (index < 3) {
      status = 'in_progress';
      progress = index === 0 ? 75 : index === 1 ? 50 : 30;
    } else {
      status = 'not_started';
      progress = 0;
    }

    const rec = {
      studentId,
      lessonId: lesson.id,
      rawId: lesson._id,
      title: lesson.title,
      progress,
      status,
      completedAt,
      updatedAt: new Date()
    };
    studentMap.set(lesson.id, rec);
    if (lesson._id) studentMap.set(lesson._id, rec);
  });

  inMemoryProgress.set(studentId, studentMap);
  return studentMap;
}

export const progressStore = {
  recordProgress(studentId = 'student-demo', lessonId, progressVal = 0) {
    const studentMap = initDefaultProgress(studentId);
    const numericProgress = Math.min(100, Math.max(0, Number(progressVal) || 0));

    let status = 'not_started';
    if (numericProgress >= 100) {
      status = 'completed';
    } else if (numericProgress > 0) {
      status = 'in_progress';
    }

    const existing = studentMap.get(lessonId) || {
      studentId,
      lessonId,
      progress: 0,
      status: 'not_started'
    };

    const updated = {
      ...existing,
      studentId,
      lessonId,
      progress: numericProgress,
      status,
      completedAt: numericProgress >= 100 ? (existing.completedAt || new Date()) : null,
      updatedAt: new Date()
    };

    studentMap.set(lessonId, updated);
    return updated;
  },

  getSummary(studentId = 'student-demo') {
    const studentMap = initDefaultProgress(studentId);
    const uniqueRecords = new Map();

    for (const [id, rec] of studentMap.entries()) {
      if (!uniqueRecords.has(rec.lessonId)) {
        uniqueRecords.set(rec.lessonId, rec);
      }
    }

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    for (const rec of uniqueRecords.values()) {
      if (rec.status === 'completed') completed++;
      else if (rec.status === 'in_progress') inProgress++;
      else notStarted++;
    }

    // Ensure total aligns with 15 curriculum lessons
    const total = mockLessons.length;
    notStarted = Math.max(0, total - completed - inProgress);

    return {
      total,
      completed,
      inProgress,
      notStarted,
      records: Array.from(uniqueRecords.values())
    };
  }
};

export const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
