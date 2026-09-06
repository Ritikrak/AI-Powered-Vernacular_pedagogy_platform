import { classroomService } from '../services/classroom.service.js';
import { translationService } from '../services/translation.service.js';

export function setupClassroomSockets(io) {
  const classroomNamespace = io.of('/classroom');

  classroomNamespace.on('connection', (socket) => {
    console.log(`🔌 [SOCKET.IO] Client connected: ${socket.id}`);

    // Join classroom room
    socket.on('join_room', (data = {}) => {
      const roomCode = data.room || 'main';
      const role = data.role || 'student';
      const name = data.name || (role === 'teacher' ? 'Classroom Teacher' : 'Student');
      const preferredLanguage = data.preferredLanguage || 'Santhali';

      socket.join(roomCode);

      // Join language-specific subchannel for targeted real-time delivery
      const langChannel = `${roomCode}:${preferredLanguage.toLowerCase()}`;
      socket.join(langChannel);

      socket.data = { roomCode, role, name, preferredLanguage };

      if (role === 'teacher') {
        classroomService.registerTeacher(roomCode, socket.id, { name });
        console.log(`👩🏾‍🏫 [SOCKET.IO] Teacher "${name}" joined room "${roomCode}"`);
        socket.to(roomCode).emit('teacher:status', { online: true, name });
      } else {
        classroomService.registerStudent(roomCode, socket.id, { name, preferredLanguage });
        console.log(`👦🏽 [SOCKET.IO] Student "${name}" joined room "${roomCode}" (Lang: ${preferredLanguage})`);
        socket.to(roomCode).emit('student:joined', { name, preferredLanguage });
      }

      // Send current state to newly joined user
      const roomState = classroomService.getRoomState(roomCode);
      socket.emit('room:state', roomState);
    });

    // Language preference change on the fly
    socket.on('change_language', ({ language }) => {
      if (!language || !socket.data?.roomCode) return;
      const { roomCode, preferredLanguage } = socket.data;

      // Leave old subchannel, join new
      socket.leave(`${roomCode}:${preferredLanguage.toLowerCase()}`);
      socket.join(`${roomCode}:${language.toLowerCase()}`);
      socket.data.preferredLanguage = language;

      console.log(`🌐 [SOCKET.IO] Socket ${socket.id} updated language to ${language}`);
      socket.emit('language:updated', { language });
    });

    // Teacher broadcasts speech / lesson explanation
    socket.on('teacher:speech', async (payload = {}) => {
      const roomCode = socket.data?.roomCode || payload.room || 'main';
      const text = payload.text || payload.transcript || '';
      const sourceLang = payload.sourceLanguage || 'Hindi';

      if (!text.trim()) return;

      console.log(`📢 [CLASSROOM BROADCAST] Teacher speaking in room "${roomCode}": "${text}"`);

      try {
        // Translate into all room languages in parallel
        const messageRecord = await classroomService.processTeacherSpeech(roomCode, text, sourceLang);

        // 1. General broadcast with full multilingual dictionary
        classroomNamespace.to(roomCode).emit('classroom:broadcast', messageRecord);

        // 2. Language-targeted delivery directly to students listening in specific dialects
        for (const [lang, translationData] of Object.entries(messageRecord.translations)) {
          const langChannel = `${roomCode}:${lang.toLowerCase()}`;
          classroomNamespace.to(langChannel).emit('classroom:speech_translated', {
            id: messageRecord.id,
            sourceText: text,
            sourceLanguage: sourceLang,
            language: lang,
            translatedText: translationData.text,
            phoneticText: translationData.phonetic,
            audioUrl: translationData.audioUrl,
            timestamp: messageRecord.timestamp
          });
        }
      } catch (err) {
        console.error('❌ [SOCKET.IO ERROR] Failed to process teacher speech:', err);
        socket.emit('error', { message: 'Speech translation pipeline encountered an error' });
      }
    });

    // Student asks a question in their regional tongue -> translated back to teacher in Hindi
    socket.on('student:question', async (payload = {}) => {
      const roomCode = socket.data?.roomCode || payload.room || 'main';
      const studentName = socket.data?.name || payload.studentName || 'Student';
      const questionText = payload.text || '';
      const studentLang = socket.data?.preferredLanguage || payload.language || 'Santhali';

      if (!questionText.trim()) return;

      console.log(`🙋 [STUDENT QUESTION] "${studentName}" (${studentLang}): "${questionText}"`);

      try {
        // Translate question back to Hindi for teacher
        const translatedBack = await translationService.translate(questionText, 'Hindi', studentLang);

        classroomNamespace.to(roomCode).emit('classroom:student_question', {
          id: `q_${Date.now()}`,
          studentName,
          originalLanguage: studentLang,
          originalText: questionText,
          hindiTranslation: translatedBack.translatedText,
          timestamp: new Date()
        });
      } catch (err) {
        console.error('❌ [SOCKET.IO ERROR] Failed to translate student question:', err);
      }
    });

    // Student raises hand
    socket.on('student:raise_hand', () => {
      const roomCode = socket.data?.roomCode || 'main';
      const studentName = socket.data?.name || 'A student';
      classroomNamespace.to(roomCode).emit('classroom:hand_raised', {
        studentName,
        timestamp: new Date()
      });
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
      }
      console.log(`🔌 [SOCKET.IO] Client disconnected: ${socket.id}`);
    });
  });
}
