import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    teacherId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      default: 'Vernacular Classroom'
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    currentLesson: {
      type: String,
      default: 'Plants Around Us'
    },
    currentLanguage: {
      type: String,
      default: 'Hindi'
    }
  },
  {
    timestamps: true
  }
);

// In-memory fallback map for resilience
export const inMemoryRooms = new Map();

// Pre-seed default rooms
inMemoryRooms.set('MAIN', {
  roomCode: 'MAIN',
  teacherId: 'usr_teacher_01',
  name: 'Main Live Classroom',
  active: true,
  currentLesson: 'Plants Around Us',
  currentLanguage: 'Hindi',
  createdAt: new Date(),
  updatedAt: new Date()
});

inMemoryRooms.set('CLASS-101', {
  roomCode: 'CLASS-101',
  teacherId: 'usr_teacher_01',
  name: 'Class 5 Science & Vernacular',
  active: true,
  currentLesson: 'The Water Cycle',
  currentLanguage: 'Hindi',
  createdAt: new Date(),
  updatedAt: new Date()
});

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
