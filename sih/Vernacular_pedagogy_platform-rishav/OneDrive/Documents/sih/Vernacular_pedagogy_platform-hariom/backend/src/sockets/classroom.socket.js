import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { classroomService } from '../services/classroom.service.js';
import { translationService } from '../services/translation.service.js';

export function setupClassroomSockets(io) {
  const classroomNamespace = io.of('/classroom');

  // 1. JWT Authentication Middleware on Socket.IO Handshake
  classroomNamespace.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (token) {
        try {
          const decoded = jwt.verify(token, env.jwtSecret);
          socket.user = {
            id: decoded.id || decoded._id,
            name: decoded.name || 'User',
            role: decoded.role || 'student',
            email: decoded.email,
            preferredLanguage: decoded.preferredLanguage || 'Santhali'
          };
        } catch {
          // Token expired or invalid
          console.warn(`⚠️ [SOCKET.IO AUTH] Invalid token for socket ${socket.id}`);
        }
      }

      // If no valid JWT token, allow fallback role from handshake for demo/dev resilience
      if (!socket.user) {
        const handshakeRole = socket.handshake.auth?.role || socket.handshake.query?.role || 'student';
        const handshakeName = socket.handshake.auth?.name || socket.handshake.query?.name || (handshakeRole === 'teacher' ? 'Classroom Teacher' : 'Student');
        socket.user = {
          id: `guest_${Date.now()}`,
          name: handshakeName,
          role: handshakeRole,
          preferredLanguage: socket.handshake.auth?.preferredLanguage || 'Santhali'
        };
      }

      next();
    } catch (err) {
      console.error('Socket auth middleware error:', err);
      next();
    }
  });

  // 2. Connection and Event Routing
  classroomNamespace.on('connection', (socket) => {
    console.log(`🔌 [SOCKET.IO] Connected: ${socket.id} (User: ${socket.user?.name}, Role: ${socket.user?.role})`);

    // Helper: Enforce RBAC
    const assertTeacherRole = (eventName = 'action') => {
      const role = socket.data?.role || socket.user?.role;
      if (role !== 'teacher' && role !== 'admin') {
        console.warn(`⛔ [SOCKET RBAC] Blocked unauthorized teacher event "${eventName}" from ${socket.id} (Role: ${role})`);
        socket.emit('error', { error: 'Teacher access required' });
        return false;
      }
      return true;
    };

    // Helper: Broadcast live presence with ACTUAL dynamic count
    const broadcastRoomPresence = (roomCode) => {
      const state = classroomService.getRoomState(roomCode);
      const payload = {
        roomId: state.roomId,
        roomCode,
        studentCount: state.studentCount, // ACTUAL connected count
        teacherOnline: state.teacherOnline,
        teacherName: state.teacherName,
        active: state.active,
        currentLesson: state.currentLesson,
        currentLanguage: state.currentLanguage,
        students: state.students
      };
      classroomNamespace.to(roomCode).emit('room:presence', payload);
      classroomNamespace.to(roomCode).emit('classroom:participants', payload);
    };

    // Join room handler
    const handleJoin = (data = {}) => {
      const roomCode = (data.room || data.roomCode || data.id || data.roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      const role = data.role || socket.handshake.auth?.role || socket.handshake.query?.role || socket.user?.role || 'student';
      const name = data.name || socket.handshake.auth?.name || socket.handshake.query?.name || (role === 'teacher' ? 'Classroom Teacher' : (socket.user?.name || 'Student'));
      const preferredLanguage = data.preferredLanguage || socket.handshake.auth?.preferredLanguage || socket.user?.preferredLanguage || 'Santhali';

      socket.join(roomCode);

      // Join language-specific subchannel for targeted real-time delivery
      const langChannel = `${roomCode}:${preferredLanguage.toLowerCase()}`;
      socket.join(langChannel);

      socket.data = { roomCode, role, name, preferredLanguage };
      if (socket.user) {
        socket.user.role = role;
        socket.user.name = name;
        socket.user.preferredLanguage = preferredLanguage;
      }

      if (role === 'teacher') {
        classroomService.registerTeacher(roomCode, socket.id, { name, id: socket.user?.id });
        console.log(`👩🏾‍🏫 [SOCKET.IO] Teacher "${name}" registered in room "${roomCode}"`);
        socket.to(roomCode).emit('teacher:status', { online: true, name });
      } else {
        classroomService.registerStudent(roomCode, socket.id, { name, preferredLanguage, id: socket.user?.id });
        console.log(`👦🏽 [SOCKET.IO] Student "${name}" joined room "${roomCode}" (Lang: ${preferredLanguage})`);
        socket.to(roomCode).emit('student:joined', { name, preferredLanguage });
      }

      // Send current state to newly joined socket
      const roomState = classroomService.getRoomState(roomCode);
      socket.emit('room:state', roomState);

      // Broadcast dynamic count update
      broadcastRoomPresence(roomCode);
    };

    // Support both standard names
    socket.on('join_room', handleJoin);
    socket.on('class:join', handleJoin);
    socket.on('student:join', handleJoin);

    // Leave room handler
    const handleLeave = () => {
      const roomCode = socket.data?.roomCode || 'MAIN';
      socket.leave(roomCode);
      const result = classroomService.removeParticipant(socket.id);
      if (result) {
        if (result.role === 'teacher') {
          socket.to(roomCode).emit('teacher:status', { online: false });
        } else {
          socket.to(roomCode).emit('student:left', { student: result.student });
        }
        broadcastRoomPresence(roomCode);
      }
    };

    socket.on('class:leave', handleLeave);
    socket.on('student:leave', handleLeave);

    // Teacher starts classroom
    socket.on('teacher:start-class', async ({ room, roomId } = {}) => {
      if (!assertTeacherRole('teacher:start-class')) return;
      const roomCode = (room || roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      await classroomService.startClassroom(roomCode, socket.user?.id);
      console.log(`🚀 [CLASSROOM STARTED] Room "${roomCode}" started by teacher`);
      classroomNamespace.to(roomCode).emit('classroom:started', { roomCode, active: true, timestamp: new Date() });
      broadcastRoomPresence(roomCode);
    });

    // Teacher ends classroom
    socket.on('teacher:end-class', async ({ room, roomId } = {}) => {
      if (!assertTeacherRole('teacher:end-class')) return;
      const roomCode = (room || roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      await classroomService.endClassroom(roomCode, socket.user?.id);
      console.log(`🛑 [CLASSROOM ENDED] Room "${roomCode}" ended by teacher`);
      classroomNamespace.to(roomCode).emit('classroom:ended', { roomCode, active: false, timestamp: new Date() });
      broadcastRoomPresence(roomCode);
    });

    socket.on('class:ended', ({ room } = {}) => {
      if (!assertTeacherRole('class:ended')) return;
      const roomCode = (room || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      classroomNamespace.to(roomCode).emit('classroom:ended', { roomCode, active: false, timestamp: new Date() });
    });

    // Language preference change for student
    const handleLanguageChange = ({ language } = {}) => {
      if (!language || !socket.data?.roomCode) return;
      const { roomCode, preferredLanguage } = socket.data;

      socket.leave(`${roomCode}:${preferredLanguage.toLowerCase()}`);
      socket.join(`${roomCode}:${language.toLowerCase()}`);
      socket.data.preferredLanguage = language;

      console.log(`🌐 [SOCKET.IO] Socket ${socket.id} updated mother tongue to ${language}`);
      socket.emit('language:updated', { language });
      broadcastRoomPresence(roomCode);
    };

    socket.on('change_language', handleLanguageChange);
    socket.on('student:set-language', handleLanguageChange);

    // Teacher changes teaching language
    socket.on('teacher:change-language', ({ language = 'Hindi', room, roomId } = {}) => {
      if (!assertTeacherRole('teacher:change-language')) return;
      const roomCode = (room || roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      const roomState = classroomService.getOrCreateRoom(roomCode);
      roomState.currentLanguage = language;
      classroomNamespace.to(roomCode).emit('teacher:language-change', { language });
      broadcastRoomPresence(roomCode);
    });

    // Teacher broadcasts speech / lesson explanation
    const handleTeacherBroadcast = async (payload = {}) => {
      if (!assertTeacherRole('teacher:broadcast')) return;

      const roomCode = (socket.data?.roomCode || payload.roomId || payload.room || payload.roomCode || 'MAIN').toUpperCase().trim();
      const text = payload.text || payload.transcript || '';
      const sourceLang = payload.language || payload.sourceLanguage || 'Hindi';

      if (!text.trim()) return;

      console.log(`📢 [CLASSROOM BROADCAST] Teacher speaking in room "${roomCode}": "${text}"`);

      try {
        const messageRecord = await classroomService.processTeacherSpeech(
          roomCode,
          text,
          sourceLang,
          socket.user?.id || 'usr_teacher_01'
        );

        // Format translations dictionary for students
        const translationsMap = {};
        for (const [lang, val] of Object.entries(messageRecord.translations)) {
          translationsMap[lang.toLowerCase()] = val.text;
          translationsMap[lang] = val.text;
        }

        const standardBroadcastPayload = {
          roomId: roomCode,
          teacherId: socket.user?.id || 'usr_teacher_01',
          originalLanguage: sourceLang === 'Hindi' ? 'hi' : sourceLang,
          originalText: text,
          translations: translationsMap,
          fullTranslations: messageRecord.translations,
          audioUrl: messageRecord.audioUrl,
          timestamp: messageRecord.timestamp
        };

        // 1. General broadcast to room
        classroomNamespace.to(roomCode).emit('teacher:broadcast', standardBroadcastPayload);
        classroomNamespace.to(roomCode).emit('classroom:broadcast', messageRecord);
        classroomNamespace.to(roomCode).emit('classroom:speech_translated', {
          ...standardBroadcastPayload,
          sourceText: text,
          teacherText: text,
          translatedText: messageRecord.translations?.Santhali?.text || text,
          phoneticText: messageRecord.translations?.Santhali?.phonetic || ''
        });
        classroomNamespace.to(roomCode).emit('translation:new', messageRecord);
        classroomNamespace.to(roomCode).emit('translation:completed', standardBroadcastPayload);

        // 2. Dialect-targeted delivery
        for (const [lang, translationData] of Object.entries(messageRecord.translations)) {
          const langChannel = `${roomCode}:${lang.toLowerCase()}`;
          const targetedPayload = {
            id: messageRecord.id,
            roomId: roomCode,
            sourceText: text,
            teacherText: text,
            sourceLanguage: sourceLang,
            language: lang,
            translatedText: translationData.text,
            phoneticText: translationData.phonetic,
            audioUrl: translationData.audioUrl,
            timestamp: messageRecord.timestamp
          };
          classroomNamespace.to(langChannel).emit('classroom:speech_translated', targetedPayload);
          classroomNamespace.to(langChannel).emit('translation:new', targetedPayload);
        }
      } catch (err) {
        console.error('❌ [SOCKET.IO ERROR] Speech broadcast failed:', err);
        socket.emit('error', { message: 'Speech translation pipeline encountered an error' });
      }
    };

    socket.on('teacher:broadcast', handleTeacherBroadcast);
    socket.on('teacher:speech', handleTeacherBroadcast);

    // Teacher sends audio stream
    socket.on('teacher:audio', (payload = {}) => {
      if (!assertTeacherRole('teacher:audio')) return;
      const roomCode = (socket.data?.roomCode || payload.roomId || 'MAIN').toUpperCase().trim();
      socket.to(roomCode).emit('teacher:audio', payload);
    });

    // Student asks question or speaks doubt
    const handleStudentQuestion = async (payload = {}) => {
      const roomCode = (socket.data?.roomCode || payload.roomId || payload.room || 'MAIN').toUpperCase().trim();
      const studentName = payload.studentName || socket.data?.name || socket.user?.name || 'Student';
      const questionText = payload.text || payload.transcript || '';
      const studentLang = payload.language || socket.data?.preferredLanguage || socket.user?.preferredLanguage || 'Santhali';
      const isVoice = !!payload.isVoice;

      if (!questionText.trim()) return;

      console.log(`🙋 [STUDENT ${isVoice ? 'VOICE DOUBT' : 'QUESTION'}] "${studentName}" (${studentLang}): "${questionText}"`);

      try {
        const questionRecord = await classroomService.addQuestion(roomCode, {
          studentName,
          text: questionText,
          language: studentLang,
          isVoice
        });

        // Broadcast to whole classroom, teacher channel, and echo to sender
        classroomNamespace.to(roomCode).emit('classroom:student_question', questionRecord);
        classroomNamespace.to(roomCode).emit('teacher:student_question', questionRecord);
        socket.emit('student:question_sent', questionRecord);
      } catch (err) {
        console.error('❌ [SOCKET.IO ERROR] Student question error:', err);
      }
    };

    socket.on('student:question', handleStudentQuestion);
    socket.on('student:ask-question', handleStudentQuestion);
    socket.on('student:speak', (p) => handleStudentQuestion({ ...p, isVoice: true }));
    socket.on('student:live_speech', (p) => handleStudentQuestion({ ...p, isVoice: true }));

    // Student finished speaking turn
    socket.on('student:end_speak', (payload = {}) => {
      const roomCode = (socket.data?.roomCode || payload.roomId || payload.room || 'MAIN').toUpperCase().trim();
      const studentName = payload.studentName || socket.data?.name || socket.user?.name || 'Student';
      console.log(`🎤 [STUDENT ENDED SPEAKING] ${studentName} in ${roomCode}`);
      classroomNamespace.to(roomCode).emit('classroom:speaker_cleared', { studentName });
    });
    socket.on('student:finish-speak', (payload = {}) => {
      const roomCode = (socket.data?.roomCode || payload.roomId || payload.room || 'MAIN').toUpperCase().trim();
      const studentName = payload.studentName || socket.data?.name || socket.user?.name || 'Student';
      classroomNamespace.to(roomCode).emit('classroom:speaker_cleared', { studentName });
    });

    // Teacher answers question (supports text and spoken voice replies)
    const handleTeacherAnswer = async (payload = {}) => {
      if (!assertTeacherRole('teacher:answer')) return;

      const roomCode = (socket.data?.roomCode || payload.roomId || payload.room || 'MAIN').toUpperCase().trim();
      const { questionId, text, language = 'Hindi', isVoice = false } = payload;

      if (!questionId || !text) return;

      console.log(`👩🏾‍🏫 [TEACHER ${isVoice ? 'VOICE REPLY' : 'ANSWER'}] To question ${questionId}: "${text}"`);

      try {
        const answerRecord = await classroomService.addAnswer(roomCode, {
          questionId,
          text,
          language,
          isVoice
        });

        classroomNamespace.to(roomCode).emit('classroom:teacher_answer', answerRecord);
        classroomNamespace.to(roomCode).emit('student:answer_received', answerRecord);
      } catch (err) {
        console.error('❌ [SOCKET.IO ERROR] Teacher answer error:', err);
      }
    };

    socket.on('teacher:answer', handleTeacherAnswer);
    socket.on('teacher:voice_reply', (p) => handleTeacherAnswer({ ...p, isVoice: true }));

    // Student raises hand
    const handleRaiseHand = (payload = {}) => {
      const roomCode = (socket.data?.roomCode || payload.roomId || payload.room || 'MAIN').toUpperCase().trim();
      const studentName = payload.studentName || socket.data?.name || socket.user?.name || 'Student';

      const handRecord = classroomService.recordHandRaise(roomCode, {
        studentName,
        socketId: socket.id
      });

      console.log(`✋ [HAND RAISED] ${studentName} in ${roomCode}`);
      classroomNamespace.to(roomCode).emit('classroom:hand_raised', handRecord);
    };

    socket.on('student:raise_hand', handleRaiseHand);
    socket.on('student:raise-hand', handleRaiseHand);

    // Teacher allows student to speak
    socket.on('teacher:allow-speak', ({ room, roomId, studentName } = {}) => {
      if (!assertTeacherRole('teacher:allow-speak')) return;
      const roomCode = (room || roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      classroomService.resolveHandRaise(roomCode, studentName, 'allow');

      console.log(`🎤 [TEACHER ALLOWED SPEAK] ${studentName} in ${roomCode}`);
      classroomNamespace.to(roomCode).emit('teacher:allow-speak', {
        studentName,
        allowed: true,
        message: 'You can speak now'
      });
    });

    socket.on('teacher:allow_speak', ({ room, roomId, studentName } = {}) => {
      if (!assertTeacherRole('teacher:allow_speak')) return;
      const roomCode = (room || roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      classroomService.resolveHandRaise(roomCode, studentName, 'allow');
      classroomNamespace.to(roomCode).emit('teacher:allow-speak', {
        studentName,
        allowed: true,
        message: 'You can speak now'
      });
    });

    // Teacher dismisses hand
    socket.on('teacher:dismiss-hand', ({ room, roomId, studentName } = {}) => {
      if (!assertTeacherRole('teacher:dismiss-hand')) return;
      const roomCode = (room || roomId || socket.data?.roomCode || 'MAIN').toUpperCase().trim();
      classroomService.resolveHandRaise(roomCode, studentName, 'dismiss');
      classroomNamespace.to(roomCode).emit('teacher:dismiss-hand', { studentName });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const result = classroomService.removeParticipant(socket.id);
      if (result) {
        if (result.role === 'teacher') {
          classroomNamespace.to(result.roomCode).emit('teacher:status', { online: false });
        } else {
          classroomNamespace.to(result.roomCode).emit('student:left', { student: result.student });
        }
        broadcastRoomPresence(result.roomCode);
      }
      console.log(`🔌 [SOCKET.IO] Disconnected: ${socket.id}`);
    });
  });
}
