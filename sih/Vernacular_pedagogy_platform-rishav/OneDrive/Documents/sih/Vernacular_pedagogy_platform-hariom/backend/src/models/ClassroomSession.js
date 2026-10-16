import mongoose from 'mongoose';

const classroomSessionSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      default: 'Vernacular Live Classroom'
    },
    teacherName: {
      type: String,
      default: 'Classroom Teacher'
    },
    teacherId: {
      type: String,
      default: 'usr_teacher_01'
    },
    isLive: {
      type: Boolean,
      default: true
    },
    activeStudents: [
      {
        socketId: String,
        studentId: String,
        name: String,
        preferredLanguage: String,
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    transcripts: [
      {
        speaker: { type: String, default: 'teacher' },
        sourceText: String,
        sourceLanguage: { type: String, default: 'Hindi' },
        translations: {
          type: Map,
          of: {
            text: String,
            phonetic: String,
            audioBase64: String
          }
        },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const ClassroomSession = mongoose.models.ClassroomSession || mongoose.model('ClassroomSession', classroomSessionSchema);
