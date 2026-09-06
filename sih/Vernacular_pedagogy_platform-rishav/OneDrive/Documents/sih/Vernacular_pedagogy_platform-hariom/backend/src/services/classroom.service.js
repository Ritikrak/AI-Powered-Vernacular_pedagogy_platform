import { ClassroomSession } from '../models/ClassroomSession.js';
import { translationService } from './translation.service.js';
import { ttsService } from './tts.service.js';

class ClassroomService {
  constructor() {
    // In-memory quick lookup for active socket sessions
    this.activeRooms = new Map();
  }

  getOrCreateRoom(roomCode = 'main', title = 'Vernacular Classroom') {
    if (!this.activeRooms.has(roomCode)) {
      this.activeRooms.set(roomCode, {
        roomCode,
        title,
        teacher: null,
        students: new Map(), // socketId -> student data
        transcripts: []
      });
    }
    return this.activeRooms.get(roomCode);
  }

  registerTeacher(roomCode, socketId, teacherData = {}) {
    const room = this.getOrCreateRoom(roomCode);
    room.teacher = {
      socketId,
      name: teacherData.name || 'Classroom Teacher',
      role: 'teacher',
      joinedAt: new Date()
    };
    return room;
  }

  registerStudent(roomCode, socketId, studentData = {}) {
    const room = this.getOrCreateRoom(roomCode);
    const student = {
      socketId,
      studentId: studentData.studentId || `std_${Date.now()}`,
      name: studentData.name || 'Student',
      preferredLanguage: studentData.preferredLanguage || 'Santhali',
      role: 'student',
      joinedAt: new Date()
    };
    room.students.set(socketId, student);
    return student;
  }

  removeParticipant(socketId) {
    for (const [roomCode, room] of this.activeRooms.entries()) {
      if (room.teacher && room.teacher.socketId === socketId) {
        room.teacher = null;
        return { roomCode, role: 'teacher' };
      }
      if (room.students.has(socketId)) {
        const student = room.students.get(socketId);
        room.students.delete(socketId);
        return { roomCode, role: 'student', student };
      }
    }
    return null;
  }

  getRoomState(roomCode) {
    const room = this.getOrCreateRoom(roomCode);
    return {
      roomCode: room.roomCode,
      title: room.title,
      teacherOnline: !!room.teacher,
      teacherName: room.teacher?.name || 'Classroom Teacher',
      studentCount: room.students.size,
      students: Array.from(room.students.values()).map(s => ({
        name: s.name,
        preferredLanguage: s.preferredLanguage
      })),
      recentTranscripts: room.transcripts.slice(-15)
    };
  }

  /**
   * Process teacher speech:
   * 1. Translates into all target languages present in the room
   * 2. Synthesizes TTS audio metadata
   * 3. Stores transcript in session memory & db
   */
  async processTeacherSpeech(roomCode, sourceText, sourceLanguage = 'Hindi') {
    const room = this.getOrCreateRoom(roomCode);

    // Identify all unique preferred languages requested by students in this room
    const targetLangs = new Set(['Santhali', 'Mundari', 'Ho', 'Kurukh', 'English']);
    for (const student of room.students.values()) {
      if (student.preferredLanguage) targetLangs.add(student.preferredLanguage);
    }

    const translations = {};
    await Promise.all(
      Array.from(targetLangs).map(async (lang) => {
        try {
          const res = await translationService.translate(sourceText, lang, sourceLanguage);
          const tts = await ttsService.synthesize(res.translatedText, lang);
          translations[lang] = {
            text: res.translatedText,
            phonetic: res.phoneticText,
            audioUrl: tts.audioUrl,
            provider: res.provider
          };
        } catch {
          translations[lang] = {
            text: sourceText,
            phonetic: sourceText,
            audioUrl: null,
            provider: 'error-fallback'
          };
        }
      })
    );

    const messageRecord = {
      id: `msg_${Date.now()}`,
      speaker: 'teacher',
      sourceText,
      sourceLanguage,
      translations,
      timestamp: new Date()
    };

    room.transcripts.push(messageRecord);
    return messageRecord;
  }
}

export const classroomService = new ClassroomService();
