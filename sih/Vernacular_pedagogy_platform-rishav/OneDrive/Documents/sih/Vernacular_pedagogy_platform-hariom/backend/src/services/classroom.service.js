import { Room, inMemoryRooms } from '../models/Room.js';
import { Broadcast, inMemoryBroadcasts } from '../models/Broadcast.js';
import { ClassroomSession } from '../models/ClassroomSession.js';
import { translationService } from './translation.service.js';
import { ttsService } from './tts.service.js';
import { isMongoConnected } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';

function codeToLanguage(code) {
  const map = {
    sat: 'Santhali',
    santhali: 'Santhali',
    unr: 'Mundari',
    mundari: 'Mundari',
    hoc: 'Ho',
    ho: 'Ho',
    kru: 'Kurukh',
    kurukh: 'Kurukh',
    hi: 'Hindi',
    hindi: 'Hindi',
    en: 'English',
    english: 'English'
  };
  return map[(code || '').toLowerCase().trim()] || 'Santhali';
}

class ClassroomService {
  constructor() {
    // In-memory quick lookup for active rooms & socket participants
    this.activeRooms = new Map();

    // Pre-initialize standard rooms
    this.getOrCreateRoom('MAIN', 'Main Live Classroom', 'usr_teacher_01');
    this.getOrCreateRoom('CLASS-101', 'Class 5 Science & Vernacular', 'usr_teacher_01');
    this.getOrCreateRoom('room-01', 'Room 01 - Science & Vernacular', 'usr_teacher_01');
  }

  getRoomKey(code) {
    return (code || 'MAIN').toUpperCase().trim();
  }

  getOrCreateRoom(roomCode = 'MAIN', name = 'Vernacular Classroom', teacherId = 'usr_teacher_01') {
    const code = this.getRoomKey(roomCode);
    if (!this.activeRooms.has(code)) {
      const initialTranscripts = code === 'MAIN' ? [
        {
          id: 'bc_initial_01',
          roomId: 'MAIN',
          roomCode: 'MAIN',
          teacherId: 'usr_teacher_01',
          speaker: 'teacher',
          teacherText: 'नमस्ते बच्चों! आज हम जल चक्र के बारे में सीखेंगे।',
          sourceText: 'नमस्ते बच्चों! आज हम जल चक्र के बारे में सीखेंगे।',
          originalText: 'नमस्ते बच्चों! आज हम जल चक्र के बारे में सीखेंगे।',
          sourceLanguage: 'Hindi',
          translations: {
            Santhali: {
              text: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱨᱮ ᱵᱷᱟᱯ ᱟᱨ ᱫᱟᱜ ᱡᱟᱹᱲᱤ ᱡᱚᱛᱚ ᱠᱷᱚᱱ ᱢᱩᱬᱩᱛ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ᱾',
              phonetic: "Da' chakra re bhap oro da' jaṛi joto khon muṛut kami kana.",
              audioUrl: '/api/speech/audio-stream?text=%E1%B1%AB%E1%B1%9F%E1%B1%9C&language=Santhali'
            }
          },
          timestamp: new Date()
        }
      ] : [];

      this.activeRooms.set(code, {
        roomCode: code,
        name,
        title: name,
        teacherId,
        active: true,
        currentLesson: 'Plants Around Us',
        currentLanguage: 'Hindi',
        teacher: null, // Connected socket teacher
        students: new Map(), // socketId -> student data
        transcripts: initialTranscripts,
        questions: [],
        handRaises: new Map(),
        createdAt: new Date()
      });
    }
    return this.activeRooms.get(code);
  }

  /**
   * Teacher creates room: POST /api/classrooms
   */
  async createRoom(teacherId, { roomCode, name = 'Vernacular Classroom', currentLesson = 'Plants Around Us', currentLanguage = 'Hindi' } = {}) {
    const code = roomCode ? this.getRoomKey(roomCode) : `ROOM-${Math.floor(100 + Math.random() * 900)}`;

    let roomDoc = null;
    if (isMongoConnected()) {
      try {
        roomDoc = await Room.findOneAndUpdate(
          { roomCode: code },
          {
            roomCode: code,
            teacherId,
            name,
            active: true,
            currentLesson,
            currentLanguage
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('MongoDB Room create fallback:', err);
      }
    }

    const memoryRoom = {
      roomCode: code,
      name,
      title: name,
      teacherId,
      active: true,
      currentLesson,
      currentLanguage,
      teacher: null,
      students: new Map(),
      transcripts: [],
      questions: [],
      handRaises: new Map(),
      createdAt: new Date()
    };
    this.activeRooms.set(code, memoryRoom);

    return roomDoc ? roomDoc.toObject() : memoryRoom;
  }

  /**
   * Teacher starts classroom session
   */
  async startClassroom(roomCode, teacherId) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    room.active = true;

    if (isMongoConnected()) {
      try {
        await Room.updateOne({ roomCode: code }, { active: true });
      } catch (err) {
        console.warn('MongoDB startClassroom fallback:', err);
      }
    }

    return room;
  }

  /**
   * Teacher ends classroom session
   */
  async endClassroom(roomCode, teacherId) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    room.active = false;

    if (isMongoConnected()) {
      try {
        await Room.updateOne({ roomCode: code }, { active: false });
      } catch (err) {
        console.warn('MongoDB endClassroom fallback:', err);
      }
    }

    return room;
  }

  /**
   * Student joins classroom
   */
  async joinRoom(roomCode, studentData = {}) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);

    if (!room.active) {
      throw new ApiError(400, 'Classroom is not currently active.');
    }

    return {
      success: true,
      roomCode: code,
      name: room.name,
      active: room.active,
      currentLesson: room.currentLesson,
      currentLanguage: room.currentLanguage,
      studentCount: room.students.size
    };
  }

  /**
   * Get all active rooms
   */
  getActiveRooms() {
    const list = [];
    for (const [code, room] of this.activeRooms.entries()) {
      if (room.active) {
        list.push({
          id: code,
          roomId: code,
          roomCode: code,
          name: room.name || `Classroom ${code}`,
          title: room.name || `Classroom ${code}`,
          subject: 'Science',
          teacherOnline: !!room.teacher,
          teacherName: room.teacher?.name || 'Classroom Teacher',
          studentCount: room.students.size, // Actual connected student count
          isLive: room.active,
          active: room.active,
          currentLesson: room.currentLesson,
          currentLanguage: room.currentLanguage,
          createdAt: room.createdAt || new Date()
        });
      }
    }
    return list;
  }

  /**
   * Register connected teacher via socket
   */
  registerTeacher(roomCode, socketId, teacherData = {}) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    room.teacher = {
      socketId,
      id: teacherData.id || teacherData._id || 'usr_teacher',
      name: teacherData.name || 'Classroom Teacher',
      role: 'teacher',
      joinedAt: new Date()
    };
    return room;
  }

  /**
   * Register connected student via socket (Increments live count)
   */
  registerStudent(roomCode, socketId, studentData = {}) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    const student = {
      socketId,
      studentId: studentData.id || studentData._id || studentData.studentId || `std_${Date.now()}`,
      name: studentData.name || 'Student',
      preferredLanguage: studentData.preferredLanguage || 'Santhali',
      role: 'student',
      joinedAt: new Date()
    };
    room.students.set(socketId, student);
    return student;
  }

  /**
   * Remove connected participant (Decrements live count)
   */
  removeParticipant(socketId) {
    for (const [code, room] of this.activeRooms.entries()) {
      if (room.teacher && room.teacher.socketId === socketId) {
        const teacher = room.teacher;
        room.teacher = null;
        return { roomCode: code, role: 'teacher', teacher, studentCount: room.students.size };
      }
      if (room.students.has(socketId)) {
        const student = room.students.get(socketId);
        room.students.delete(socketId);
        return { roomCode: code, role: 'student', student, studentCount: room.students.size };
      }
    }
    return null;
  }

  /**
   * Get dynamic room state (ACTUAL calculated student count)
   */
  getRoomState(roomCode) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    const actualConnectedStudents = room.students.size;

    return {
      roomId: code,
      roomCode: roomCode || code,
      name: room.name,
      title: room.name,
      teacher: room.teacher?.name || 'Classroom Teacher',
      teacherOnline: !!room.teacher,
      teacherName: room.teacher?.name || 'Classroom Teacher',
      active: room.active,
      studentCount: actualConnectedStudents, // 100% dynamic actual connected students
      currentLesson: room.currentLesson,
      currentLanguage: room.currentLanguage,
      students: Array.from(room.students.values()).map(s => ({
        id: s.studentId,
        name: s.name,
        preferredLanguage: s.preferredLanguage
      })),
      recentTranscripts: room.transcripts.slice(-25),
      questions: room.questions || [],
      handRaises: Array.from((room.handRaises || new Map()).values())
    };
  }

  getMessages(roomCode) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    const msgs = (room.transcripts || []).map(t => ({
      id: t.id,
      timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM',
      isoTime: t.timestamp,
      teacherText: t.sourceText || t.teacherText || t.originalText,
      sourceText: t.sourceText || t.teacherText || t.originalText,
      sourceLanguage: t.sourceLanguage || t.originalLanguage || 'Hindi',
      translations: t.translations || {}
    }));
    return {
      roomId: code,
      roomCode: code,
      total: msgs.length,
      messages: msgs
    };
  }

  /**
   * Process teacher speech and create broadcast record
   */
  async processTeacherSpeech(roomCode, sourceText, sourceLanguage = 'Hindi', teacherId = 'usr_teacher_01') {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);

    const targetLangs = new Set(['Santhali', 'Mundari', 'Ho', 'Kurukh', 'English']);
    for (const student of room.students.values()) {
      if (student.preferredLanguage) targetLangs.add(student.preferredLanguage);
    }

    const translations = {};
    let primaryAudioUrl = null;

    await Promise.all(
      Array.from(targetLangs).map(async (lang) => {
        try {
          const res = await translationService.translate(sourceText, lang, sourceLanguage);
          const tts = await ttsService.synthesize(res.translatedText, lang, res.phoneticText);
          if (!primaryAudioUrl && tts?.audioUrl) {
            primaryAudioUrl = tts.audioUrl;
          }
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
      id: `bc_${Date.now()}`,
      roomId: code,
      roomCode: code,
      teacherId,
      speaker: 'teacher',
      teacherText: sourceText,
      sourceText,
      originalText: sourceText,
      sourceLanguage,
      originalLanguage: sourceLanguage,
      translations,
      audioUrl: primaryAudioUrl,
      timestamp: new Date()
    };

    room.transcripts.push(messageRecord);

    // Save to Mongo Broadcast collection if available
    if (isMongoConnected()) {
      try {
        await Broadcast.create({
          roomId: code,
          teacherId,
          originalText: sourceText,
          originalLanguage: sourceLanguage,
          translations,
          audioUrl: primaryAudioUrl,
          timestamp: messageRecord.timestamp
        });
      } catch (err) {
        console.warn('MongoDB Broadcast create fallback:', err);
      }
    }

    return messageRecord;
  }

  /**
   * Student asks question (supports both text and spoken doubts)
   */
  async addQuestion(roomCode, { studentName = 'Student', text, language = 'sat', isVoice = false }) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    const langName = codeToLanguage(language);

    let hindiTranslation = text;
    let phonetic = null;
    let audioUrl = null;
    try {
      const res = await translationService.translate(text, 'Hindi', langName);
      hindiTranslation = res.translatedText;
      phonetic = res.phoneticText;

      // Synthesize audio in Hindi so teacher can listen to student's translated question
      const tts = await ttsService.synthesize(hindiTranslation, 'Hindi');
      if (tts?.audioUrl) {
        audioUrl = tts.audioUrl;
      }
    } catch (err) {
      console.warn('Student question translation fallback:', err);
    }

    const question = {
      id: `q_${Date.now()}`,
      studentName,
      originalLanguage: langName,
      languageCode: language,
      originalText: text,
      text,
      hindiTranslation,
      phonetic,
      audioUrl,
      isVoice: !!isVoice,
      answer: null,
      answered: false,
      timestamp: new Date()
    };

    if (!room.questions) room.questions = [];
    room.questions.unshift(question);
    return question;
  }

  /**
   * Teacher answers question (translates to student's mother tongue & synthesizes vernacular speech)
   */
  async addAnswer(roomCode, { questionId, text, language = 'Hindi', isVoice = false }) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    const question = (room.questions || []).find(q => q.id === questionId);
    const targetLang = question ? question.originalLanguage : 'Santhali';

    let translatedAnswer = text;
    let phonetic = null;
    let audioUrl = null;
    try {
      const res = await translationService.translate(text, targetLang, 'Hindi');
      translatedAnswer = res.translatedText;
      phonetic = res.phoneticText;

      // Synthesize audio in student's native mother tongue (e.g. Santali Ol Chiki / Kurukh)
      const tts = await ttsService.synthesize(translatedAnswer, targetLang, phonetic);
      if (tts?.audioUrl) {
        audioUrl = tts.audioUrl;
      }
    } catch (err) {
      console.warn('Teacher answer translation fallback:', err);
    }

    const answerRecord = {
      id: `ans_${Date.now()}`,
      questionId,
      teacherText: text,
      hindiAnswer: text,
      translatedAnswer,
      targetLanguage: targetLang,
      phonetic,
      audioUrl,
      isVoice: !!isVoice,
      timestamp: new Date()
    };

    if (question) {
      question.answer = answerRecord;
      question.answered = true;
    }

    return answerRecord;
  }

  recordHandRaise(roomCode, { studentName = 'Student', socketId }) {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    if (!room.handRaises) room.handRaises = new Map();
    const raise = {
      studentName,
      socketId,
      status: 'pending',
      timestamp: new Date()
    };
    room.handRaises.set(studentName, raise);
    return raise;
  }

  resolveHandRaise(roomCode, studentName, action = 'allow') {
    const code = this.getRoomKey(roomCode);
    const room = this.getOrCreateRoom(code);
    if (!room.handRaises) room.handRaises = new Map();
    if (action === 'dismiss') {
      room.handRaises.delete(studentName);
      return { studentName, status: 'dismissed' };
    } else {
      const existing = room.handRaises.get(studentName) || { studentName, timestamp: new Date() };
      existing.status = 'allowed';
      existing.allowedAt = new Date();
      room.handRaises.set(studentName, existing);
      return existing;
    }
  }
}

export const classroomService = new ClassroomService();
