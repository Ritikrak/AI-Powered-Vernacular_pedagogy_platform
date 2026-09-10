import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Hand,
  Headphones,
  HelpCircle,
  Languages,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  Send,
  Sparkles,
  Users,
  Volume2,
  XCircle
} from 'lucide-react'
import {
  createClassroomSocketIO,
  DeepgramLiveAudioStreamer,
  classroomApi,
  languageApi,
  studentApi,
  speechApi,
  type Role,
  type RoomState,
  type StudentQuestion,
  type LanguageItem,
  type ClassroomHistoryMessage
} from './api'
import { useApp } from './context'
import type { Socket } from 'socket.io-client'

interface MultilingualTranslation {
  text: string
  phonetic?: string
  audioUrl?: string
  provider?: string
}

interface BroadcastMessage {
  id: string
  sourceText: string
  teacherText?: string
  sourceLanguage: string
  translations: Record<string, MultilingualTranslation>
  timestamp: string
}

export default function GoogleClassroomPage({ role }: { role: Role }) {
  const {
    userName,
    preferredLanguage,
    setPreferredLanguage,
    teacherSourceLanguage,
    setTeacherSourceLanguage,
    activeRoom,
    toast
  } = useApp()
  const isTeacher = role === 'teacher'
  const mode: 'teacher' | 'student' = isTeacher ? 'teacher' : 'student'
  const [roomCode, setRoomCode] = useState(activeRoom || 'MAIN')

  // Dynamic Socket connection state
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING'>('CONNECTING')
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [teacherOnline, setTeacherOnline] = useState(true)
  const [isRoomActive, setIsRoomActive] = useState(true)

  // Room Management states
  const [newRoomCode, setNewRoomCode] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [joinRoomCode, setJoinRoomCode] = useState('')

  // Dynamic Languages list
  const [languagesList, setLanguagesList] = useState<LanguageItem[]>([
    { code: 'sat', name: 'Santhali', script: 'Ol Chiki', native: 'संथाली / ᱥᱟᱱᱛᱟᱲᱤ' },
    { code: 'unr', name: 'Mundari', script: 'Mundari Bani', native: 'मुंडारी / ᱢᱩᱱᱰᱟᱨᱤ' },
    { code: 'hoc', name: 'Ho', script: 'Warang Citi', native: 'हो / ᱦᱳ' },
    { code: 'kru', name: 'Kurukh', script: 'Tolong Siki', native: 'कुड़ुख़ / ᱠᱩᱲᱩᱠᱷ' },
    { code: 'hi', name: 'Hindi', script: 'Devanagari', native: 'हिंदी' },
    { code: 'en', name: 'English', script: 'Latin', native: 'English' }
  ])

  // Teacher states
  const [teacherInput, setTeacherInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [lastBroadcast, setLastBroadcast] = useState<BroadcastMessage | null>(null)
  const [studentQuestions, setStudentQuestions] = useState<any[]>([])
  const [teacherAnswerInputs, setTeacherAnswerInputs] = useState<Record<string, string>>({})
  const [handRaises, setHandRaises] = useState<Array<{ studentName: string; timestamp: string; status?: string }>>([])

  // Student states
  const [studentLanguage, setStudentLanguage] = useState(preferredLanguage || 'Santhali')
  const [receivedCaption, setReceivedCaption] = useState('आज हम पौधों के बारे में सीखेंगे।')
  const [receivedTranslation, setReceivedTranslation] = useState('ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱨᱮ-ᱱᱟᱹᱲᱤ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾')
  const [receivedPhonetic, setReceivedPhonetic] = useState("Teheñ do abo dare-nari babat bon seṛaya.")
  const [receivedAudioUrl, setReceivedAudioUrl] = useState<string | null>(
    speechApi.getStreamUrl('Teheñ do abo dare-nari babat bon seṛaya.', preferredLanguage || 'Santhali', "Teheñ do abo dare-nari babat bon seṛaya.")
  )
  const [studentQuestionText, setStudentQuestionText] = useState('')
  const [myQuestions, setMyQuestions] = useState<any[]>([])
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [isAllowedToSpeak, setIsAllowedToSpeak] = useState(false)
  const [autoPlayAudio, setAutoPlayAudio] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  // Translation history list
  const [translationHistory, setTranslationHistory] = useState<ClassroomHistoryMessage[]>([])

  // Two-Way Voice Communication states
  const [isStudentRecordingDoubt, setIsStudentRecordingDoubt] = useState(false)
  const [isFloorSpeaking, setIsFloorSpeaking] = useState(false)
  const [replyingVoiceId, setReplyingVoiceId] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const recognitionRef = useRef<any>(null)
  const streamerRef = useRef<DeepgramLiveAudioStreamer | null>(null)
  const studentDoubtRecRef = useRef<any>(null)
  const floorRecRef = useRef<any>(null)
  const teacherReplyRecRef = useRef<any>(null)

  const studentLanguageRef = useRef(studentLanguage)
  studentLanguageRef.current = studentLanguage

  const autoPlayAudioRef = useRef(autoPlayAudio)
  autoPlayAudioRef.current = autoPlayAudio

  const userNameRef = useRef(userName)
  userNameRef.current = userName

  const modeRef = useRef(mode)
  modeRef.current = mode

  const teacherSourceLanguageRef = useRef(teacherSourceLanguage)
  teacherSourceLanguageRef.current = teacherSourceLanguage

  // Web Audio API notification chime generator (zero external asset dependency)
  const playChime = (type: 'question' | 'answer' | 'hand' = 'answer') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'hand') {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15)
      } else if (type === 'question') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2)
      } else {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2)
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } catch {}
  }

  // Quick feedback chips for teachers
  const quickTeacherReplies = [
    '🌟 बहुत बढ़िया सवाल! (Well done!)',
    '💡 ध्यान से सुनो, मैं दोबारा समझाता हूँ। (Listen carefully)',
    '✅ बिल्कुल सही समझा आपने! (Exactly right!)',
    '🌿 हाँ बच्चों, धूप और पानी दोनों जरूरी हैं। (Yes students)'
  ]


  // 1. Fetch Dynamic Languages and Student Preferences on mount
  useEffect(() => {
    languageApi.getLanguages()
      .then(langs => {
        if (langs && langs.length > 0) setLanguagesList(langs)
      })
      .catch(() => undefined)

    studentApi.getPreferences()
      .then(prefs => {
        if (prefs?.languageName) {
          setStudentLanguage(prefs.languageName)
          setPreferredLanguage(prefs.languageName)
        }
        if (typeof prefs?.autoPlay === 'boolean') {
          setAutoPlayAudio(prefs.autoPlay)
        }
      })
      .catch(() => undefined)

    // Load initial room details and messages history
    classroomApi.getRoomDetails(roomCode)
      .then(details => {
        setRoomState(details)
        if (details.studentCount !== undefined) setStudentCount(details.studentCount)
        if (details.teacherOnline !== undefined) setTeacherOnline(details.teacherOnline)
      })
      .catch(() => undefined)

    classroomApi.getMessages(roomCode)
      .then(res => {
        if (res?.messages && res.messages.length > 0) {
          setTranslationHistory(res.messages)
        }
      })
      .catch(() => undefined)
  }, [roomCode])

  // 2. Initialize Socket.IO connection & event listeners (rock-solid, zero flapping on UI toggles)
  useEffect(() => {
    const socket = createClassroomSocketIO({
      roomCode,
      role: mode,
      name: userName,
      preferredLanguage: studentLanguageRef.current
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectionStatus('CONNECTED')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setConnectionStatus('DISCONNECTED')
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
      setConnectionStatus('DISCONNECTED')
    })

    socket.io?.on('reconnect_attempt', () => {
      setConnectionStatus('RECONNECTING')
    })

    socket.io?.on('reconnect', () => {
      setIsConnected(true)
      setConnectionStatus('CONNECTED')
    })

    socket.on('classroom:participants', (data: any) => {
      if (data.studentCount !== undefined) setStudentCount(data.studentCount)
      if (data.students) {
        setRoomState(prev => prev ? { ...prev, students: data.students } : null)
      }
    })

    socket.on('classroom:started', () => {
      setIsRoomActive(true)
      toast(`Classroom ${roomCode.toUpperCase()} started!`, 'success')
    })

    socket.on('classroom:ended', () => {
      setIsRoomActive(false)
      toast(`Classroom ${roomCode.toUpperCase()} ended`, 'info')
    })

    socket.on('room:presence', (data: any) => {
      if (data.studentCount !== undefined) setStudentCount(data.studentCount)
      if (data.teacherOnline !== undefined) setTeacherOnline(data.teacherOnline)
      setRoomState(prev => prev ? { ...prev, ...data } : data)
    })

    socket.on('room:state', (state: RoomState) => {
      setRoomState(state)
      if (state.studentCount !== undefined) setStudentCount(state.studentCount)
      if (state.teacherOnline !== undefined) setTeacherOnline(state.teacherOnline)

      if (state.recentTranscripts && state.recentTranscripts.length > 0) {
        const latest = state.recentTranscripts[state.recentTranscripts.length - 1]
        setLastBroadcast({
          id: latest.id,
          sourceText: latest.sourceText,
          sourceLanguage: latest.sourceLanguage,
          translations: latest.translations || {},
          timestamp: latest.timestamp
        })

        const curLang = studentLanguageRef.current
        if (latest.translations && latest.translations[curLang]) {
          setReceivedCaption(latest.sourceText)
          setReceivedTranslation(latest.translations[curLang].text)
          setReceivedPhonetic(latest.translations[curLang].phonetic || '')
          setReceivedAudioUrl(latest.translations[curLang].audioUrl || null)
        }
      }
    })

    socket.on('teacher:status', ({ online, name }: { online: boolean; name?: string }) => {
      setTeacherOnline(online)
      setRoomState(prev => prev ? { ...prev, teacherOnline: online, teacherName: name || prev.teacherName } : null)
      if (online) {
        toast(`Teacher ${name || ''} is now broadcasting in Room ${roomCode.toUpperCase()}`, 'info')
      } else {
        toast('Teacher disconnected from classroom', 'info')
      }
    })

    socket.on('teacher:language-change', ({ language }: { language: string }) => {
      toast(`Teacher switched teaching language to ${language}`, 'info')
    })

    socket.on('student:joined', ({ name, preferredLanguage: lang }: { name: string; preferredLanguage: string }) => {
      toast(`${name} joined class (${lang})`, 'info')
    })

    // General broadcast with all translations
    socket.on('classroom:broadcast', (record: BroadcastMessage) => {
      setLastBroadcast(record)
      const formattedHistory: ClassroomHistoryMessage = {
        id: record.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        teacherText: record.sourceText,
        sourceText: record.sourceText,
        sourceLanguage: record.sourceLanguage,
        translations: record.translations
      }
      setTranslationHistory(prev => [formattedHistory, ...prev.slice(0, 19)])

      const curLang = studentLanguageRef.current
      if (modeRef.current === 'student' && record.translations && record.translations[curLang]) {
        const tr = record.translations[curLang]
        setReceivedCaption(record.sourceText)
        setReceivedTranslation(tr.text)
        setReceivedPhonetic(tr.phonetic || '')
        setReceivedAudioUrl(tr.audioUrl || null)

        if (autoPlayAudioRef.current) {
          playAudio(tr.audioUrl, tr.text, tr.phonetic, record.sourceText)
        }
      }
    })

    // Targeted delivery for this student's dialect
    socket.on('classroom:speech_translated', (data: {
      id: string
      sourceText: string
      teacherText?: string
      sourceLanguage: string
      language: string
      translatedText: string
      phoneticText?: string
      audioUrl?: string
    }) => {
      const curLang = studentLanguageRef.current
      if (data.language.toLowerCase() === curLang.toLowerCase()) {
        const origText = data.sourceText || data.teacherText || ''
        setReceivedCaption(origText)
        setReceivedTranslation(data.translatedText)
        setReceivedPhonetic(data.phoneticText || '')
        setReceivedAudioUrl(data.audioUrl || null)

        if (autoPlayAudioRef.current) {
          playAudio(data.audioUrl, data.translatedText, data.phoneticText, origText)
        }
      }
    })

    // Standard translation:new socket event
    socket.on('translation:new', (data: any) => {
      const curLang = studentLanguageRef.current
      if (data.translations && data.translations[curLang]) {
        const tr = data.translations[curLang]
        const origText = data.sourceText || data.teacherText || ''
        setReceivedCaption(origText)
        setReceivedTranslation(tr.text)
        setReceivedPhonetic(tr.phonetic || '')
        setReceivedAudioUrl(tr.audioUrl || null)
        if (autoPlayAudioRef.current) {
          playAudio(tr.audioUrl, tr.text, tr.phonetic, origText)
        }
      } else if (data.language && data.language.toLowerCase() === curLang.toLowerCase()) {
        const origText = data.sourceText || data.teacherText || ''
        setReceivedCaption(origText)
        setReceivedTranslation(data.translatedText)
        setReceivedPhonetic(data.phoneticText || '')
        setReceivedAudioUrl(data.audioUrl || null)
        if (autoPlayAudioRef.current) {
          playAudio(data.audioUrl, data.translatedText, data.phoneticText, origText)
        }
      }
    })

    // Student questions (teacher view & classroom broadcast)
    socket.on('classroom:student_question', (question: any) => {
      setStudentQuestions(prev => [question, ...prev.filter(q => q.id !== question.id)])
      playChime('question')
      toast(
        question.isVoice
          ? `🎙️ Spoken doubt from ${question.studentName} (${question.originalLanguage})`
          : `🙋 Question from ${question.studentName} (${question.originalLanguage})`,
        'info'
      )
    })

    // Echo for student when question sent
    socket.on('student:question_sent', (question: any) => {
      setMyQuestions(prev => [question, ...prev.filter(q => q.id !== question.id)])
    })

    // Teacher answer delivered back to student
    socket.on('classroom:teacher_answer', (answer: any) => {
      setMyQuestions(prev => prev.map(q => q.id === answer.questionId ? { ...q, answer, answered: true } : q))
      setStudentQuestions(prev => prev.map(q => q.id === answer.questionId ? { ...q, answer, answered: true } : q))
      playChime('answer')
      toast(`👩🏾‍🏫 Teacher answered question in ${answer.targetLanguage || 'your dialect'}!`, 'success')
      if (autoPlayAudioRef.current) {
        playAudio(answer.audioUrl, answer.translatedAnswer, answer.phonetic, answer.teacherText)
      }
    })

    socket.on('student:answer_received', (answer: any) => {
      setMyQuestions(prev => prev.map(q => q.id === answer.questionId ? { ...q, answer, answered: true } : q))
      playChime('answer')
      if (autoPlayAudioRef.current) {
        playAudio(answer.audioUrl, answer.translatedAnswer, answer.phonetic, answer.teacherText)
      }
    })

    // Hand raises
    socket.on('classroom:hand_raised', (alert: { studentName: string; timestamp: string; status?: string }) => {
      setHandRaises(prev => [alert, ...prev.filter(h => h.studentName !== alert.studentName)])
      playChime('hand')
      toast(`✋ ${alert.studentName} raised their hand!`, 'info')
    })

    // Teacher allowed student to speak
    socket.on('teacher:allow-speak', (data: { studentName: string; allowed: boolean; message: string }) => {
      if (data.studentName === userNameRef.current || modeRef.current === 'student') {
        setIsAllowedToSpeak(true)
        setIsHandRaised(false)
        playChime('hand')
        toast('🎤 Teacher allowed you to speak! Microphone is unlocked.', 'success')
      }
    })

    // Speaker floor released
    socket.on('classroom:speaker_cleared', ({ studentName }: { studentName: string }) => {
      setHandRaises(prev => prev.filter(h => h.studentName !== studentName))
      if (studentName === userNameRef.current) {
        setIsAllowedToSpeak(false)
        setIsFloorSpeaking(false)
      }
    })

    socket.on('teacher:dismiss-hand', ({ studentName }: { studentName: string }) => {
      setHandRaises(prev => prev.filter(h => h.studentName !== studentName))
      if (studentName === userNameRef.current) {
        setIsHandRaised(false)
        setIsAllowedToSpeak(false)
        setIsFloorSpeaking(false)
      }
    })

    // Teacher changed teaching language notification
    socket.on('teacher:language-change', ({ language }: { language: string }) => {
      if (language) {
        toast(`👩🏾‍🏫 Teacher changed classroom source language to ${language}`, 'info')
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [roomCode, mode, userName])

  // Dynamically inform socket room of language preference without reconnecting
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('change_language', { language: studentLanguage })
      socketRef.current.emit('student:set-language', { language: studentLanguage })
    }
  }, [studentLanguage])

  // Dynamically inform socket room when teacher switches teaching source language
  useEffect(() => {
    if (isTeacher && socketRef.current) {
      socketRef.current.emit('teacher:change-language', {
        language: teacherSourceLanguage,
        room: roomCode
      })
    }
  }, [teacherSourceLanguage, isTeacher, roomCode])

  // Browser speech recognition and Deepgram MediaRecorder WebSocket streaming for teacher
  const toggleSpeechRecognition = async () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      streamerRef.current?.stop()
      streamerRef.current = null
      setIsRecording(false)
      toast('Microphone stopped', 'info')
      return
    }

    try {
      const activeSourceLang = teacherSourceLanguageRef.current || 'Hindi'

      // 1. Capture and Stream Audio: Frontend (MediaRecorder audio/webm;codecs=opus over WebSocket)
      const streamer = new DeepgramLiveAudioStreamer({
        roomId: roomCode,
        sourceLanguage: activeSourceLang,
        onTranscript: (data) => {
          if (data.transcript) {
            setTeacherInput(data.transcript)
          }
          if (data.isFinal && data.translations) {
            setLastBroadcast({
              id: `dg-${Date.now()}`,
              sourceText: data.transcript,
              teacherText: data.transcript,
              sourceLanguage: activeSourceLang,
              translations: data.translations as any,
              timestamp: new Date().toISOString()
            })
          }
        },
        onError: (err) => {
          console.warn('Deepgram streaming status:', err?.message || err)
        }
      })
      await streamer.start().catch(err => {
        console.warn('MediaRecorder streaming note:', err?.message || err)
      })
      streamerRef.current = streamer
      setIsRecording(true)
      toast(`🎙️ Teacher Mic Live: Streaming audio/webm to Deepgram & listening in ${activeSourceLang}...`, 'success')

      // 2. Also initialize Web Speech API for immediate responsive interim local display
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        const speechLangMap: Record<string, string> = {
          'Hindi': 'hi-IN',
          'English': 'en-IN',
          'Bengali': 'bn-IN',
          'Odia': 'or-IN',
          'Santhali': 'sat-IN',
          'Kurukh': 'kru-IN'
        }
        recognition.lang = speechLangMap[activeSourceLang] || 'hi-IN'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('')
          setTeacherInput(transcript)
        }

        recognition.onerror = (event: any) => {
          console.warn('Web Speech API note:', event.error)
        }

        recognition.onend = () => {
          // Keep streamer active
        }

        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err: any) {
      console.error('Microphone error:', err)
      setIsRecording(false)
      toast('Microphone access note: ' + (err.message || 'Please allow microphone permissions'), 'error')
    }
  }

  // Teacher submits speech broadcast
  const handleTeacherBroadcast = async () => {
    const activeSourceLang = teacherSourceLanguageRef.current || 'Hindi'
    if (!teacherInput.trim()) {
      toast(`Please enter or speak a phrase in ${activeSourceLang} to broadcast`, 'error')
      return
    }

    const phrase = teacherInput.trim()

    // 1. Emit via authenticated Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('teacher:broadcast', {
        roomId: roomCode,
        room: roomCode,
        text: phrase,
        sourceLanguage: activeSourceLang,
        language: activeSourceLang.toLowerCase().startsWith('en') ? 'en' : 'hi'
      })
      socketRef.current.emit('teacher:speech', {
        roomId: roomCode,
        room: roomCode,
        text: phrase,
        language: activeSourceLang.toLowerCase().startsWith('en') ? 'en' : 'hi',
        sourceLanguage: activeSourceLang
      })
    }

    // 2. Call REST API endpoint for persistence
    try {
      await classroomApi.broadcast(roomCode, {
        speechText: phrase,
        sourceLanguage: activeSourceLang
      })
    } catch (err: any) {
      console.warn('REST broadcast fallback:', err?.message)
    }

    toast(`Broadcasting ${activeSourceLang} speech across all regional dialects...`, 'info')
  }

  // Quick preset phrases for teachers
  const handlePresetBroadcast = async (text: string) => {
    const activeSourceLang = teacherSourceLanguageRef.current || 'Hindi'
    setTeacherInput(text)
    if (socketRef.current) {
      socketRef.current.emit('teacher:broadcast', {
        roomId: roomCode,
        room: roomCode,
        text,
        sourceLanguage: activeSourceLang,
        language: activeSourceLang.toLowerCase().startsWith('en') ? 'en' : 'hi'
      })
      socketRef.current.emit('teacher:speech', {
        roomId: roomCode,
        room: roomCode,
        text,
        language: activeSourceLang.toLowerCase().startsWith('en') ? 'en' : 'hi',
        sourceLanguage: activeSourceLang
      })
    }
    try {
      await classroomApi.broadcast(roomCode, {
        speechText: text,
        sourceLanguage: activeSourceLang
      })
    } catch (err: any) {
      console.warn('REST broadcast fallback:', err?.message)
    }
    toast(`Broadcasting preset phrase (${activeSourceLang}) to classroom...`, 'info')
  }

  // Room Management Actions
  const handleStartClass = async () => {
    try {
      await classroomApi.startClassroom(roomCode)
      if (socketRef.current) {
        socketRef.current.emit('teacher:start-class', { roomId: roomCode, room: roomCode })
      }
      setIsRoomActive(true)
      toast(`Classroom ${roomCode.toUpperCase()} started!`, 'success')
    } catch (err: any) {
      toast(err?.response?.data?.error || err.message || 'Failed to start class', 'error')
    }
  }

  const handleEndClass = async () => {
    try {
      await classroomApi.endClassroom(roomCode)
      if (socketRef.current) {
        socketRef.current.emit('teacher:end-class', { roomId: roomCode, room: roomCode })
      }
      setIsRoomActive(false)
      toast(`Classroom ${roomCode.toUpperCase()} ended`, 'info')
    } catch (err: any) {
      toast(err?.response?.data?.error || err.message || 'Failed to end class', 'error')
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomCode.trim()) return
    const code = newRoomCode.trim().toUpperCase()
    try {
      await classroomApi.createRoom({
        roomCode: code,
        name: newRoomName.trim() || `Classroom ${code}`
      })
      setRoomCode(code)
      setNewRoomCode('')
      setNewRoomName('')
      toast(`Created and joined room ${code}`, 'success')
    } catch (err: any) {
      toast(err?.response?.data?.error || err.message || 'Failed to create room', 'error')
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinRoomCode.trim()) return
    const code = joinRoomCode.trim().toUpperCase()
    try {
      await classroomApi.joinRoom(code)
      setRoomCode(code)
      setJoinRoomCode('')
      toast(`Joined room ${code}`, 'success')
    } catch (err: any) {
      toast(err?.response?.data?.error || err.message || 'Failed to join room', 'error')
    }
  }

  // Student raises hand
  const handleRaiseHand = () => {
    if (socketRef.current) {
      socketRef.current.emit('student:raise-hand', {
        roomId: roomCode,
        room: roomCode,
        studentName: userName
      })
      setIsHandRaised(true)
      toast('Hand raised! Teacher has been notified.', 'success')
    }
  }

  // Teacher allows student to speak
  const handleTeacherAllowSpeak = (studentName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('teacher:allow-speak', {
        roomId: roomCode,
        room: roomCode,
        studentName
      })
      setHandRaises(prev => prev.filter(h => h.studentName !== studentName))
      toast(`Allowed ${studentName} to speak!`, 'success')
    }
  }

  // Teacher dismisses hand
  const handleTeacherDismissHand = (studentName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('teacher:dismiss-hand', {
        roomId: roomCode,
        room: roomCode,
        studentName
      })
      setHandRaises(prev => prev.filter(h => h.studentName !== studentName))
      toast(`Dismissed hand for ${studentName}`, 'info')
    }
  }

  // Student toggles microphone to speak doubt in native mother tongue
  const toggleStudentDoubtMic = () => {
    if (isStudentRecordingDoubt) {
      studentDoubtRecRef.current?.stop()
      setIsStudentRecordingDoubt(false)
      toast('Voice recording stopped', 'info')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast('Speech recognition not supported in this browser. Please type your doubt.', 'error')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = studentLanguage === 'English' ? 'en-IN' : 'hi-IN'
      rec.continuous = true
      rec.interimResults = true

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        setStudentQuestionText(transcript)
      }

      rec.onerror = (event: any) => {
        console.warn('Student voice input note:', event.error)
        setIsStudentRecordingDoubt(false)
      }

      rec.onend = () => {
        setIsStudentRecordingDoubt(false)
      }

      rec.start()
      studentDoubtRecRef.current = rec
      setIsStudentRecordingDoubt(true)
      toast(`🎙️ Speak your doubt now in ${studentLanguage}! Recording...`, 'success')
    } catch (err: any) {
      setIsStudentRecordingDoubt(false)
      toast('Microphone access note: ' + (err.message || 'Please allow mic permissions'), 'error')
    }
  }

  // Student toggle for live intercom floor when hand is allowed
  const toggleFloorSpeaking = () => {
    if (isFloorSpeaking) {
      floorRecRef.current?.stop()
      setIsFloorSpeaking(false)
      toast('Floor microphone paused', 'info')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast('Speech recognition not supported in this browser.', 'error')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = 'hi-IN'
      rec.continuous = true
      rec.interimResults = true

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        setStudentQuestionText(transcript)
      }

      rec.onerror = () => {
        setIsFloorSpeaking(false)
      }

      rec.onend = () => {
        setIsFloorSpeaking(false)
      }

      rec.start()
      floorRecRef.current = rec
      setIsFloorSpeaking(true)
      toast('🎤 Speaking live to the classroom! Voice is being captured.', 'success')
    } catch {
      setIsFloorSpeaking(false)
    }
  }

  // Student finishes speaking turn and releases floor
  const handleStudentFinishSpeaking = () => {
    if (floorRecRef.current) {
      try { floorRecRef.current.stop() } catch {}
    }
    setIsFloorSpeaking(false)
    setIsAllowedToSpeak(false)
    if (socketRef.current) {
      socketRef.current.emit('student:end_speak', {
        roomId: roomCode,
        room: roomCode,
        studentName: userName
      })
    }
    toast('Floor released back to teacher', 'info')
  }

  // Teacher toggles mic to speak voice reply in Hindi
  const toggleTeacherReplyMic = (questionId: string) => {
    if (replyingVoiceId === questionId) {
      teacherReplyRecRef.current?.stop()
      setReplyingVoiceId(null)
      toast('Voice reply stopped', 'info')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast('Speech recognition not supported in this browser. Please type your reply.', 'error')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = 'hi-IN'
      rec.continuous = true
      rec.interimResults = true

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        setTeacherAnswerInputs(prev => ({ ...prev, [questionId]: transcript }))
      }

      rec.onerror = () => {
        setReplyingVoiceId(null)
      }

      rec.onend = () => {
        setReplyingVoiceId(null)
      }

      rec.start()
      teacherReplyRecRef.current = rec
      setReplyingVoiceId(questionId)
      toast('🎙️ Speak your reply in Hindi now! Recording...', 'success')
    } catch {
      setReplyingVoiceId(null)
    }
  }

  // Student asks question in regional dialect (handles both typed and spoken doubts)
  const handleStudentQuestion = async (e?: React.FormEvent, forceText?: string, isVoiceDoubt = false) => {
    if (e) e.preventDefault()
    const textToSend = (forceText || studentQuestionText).trim()
    if (!textToSend) return

    const isSpoken = isVoiceDoubt || isStudentRecordingDoubt || isFloorSpeaking
    const questionPayload = {
      studentName: userName,
      text: textToSend,
      language: studentLanguage,
      isVoice: isSpoken
    }

    if (isStudentRecordingDoubt) {
      try { studentDoubtRecRef.current?.stop() } catch {}
      setIsStudentRecordingDoubt(false)
    }

    try {
      // 1. Submit via REST API
      const res = await classroomApi.askQuestion(roomCode, questionPayload)
      if (res.question) {
        setMyQuestions(prev => [res.question, ...prev.filter(q => q.id !== res.question.id)])
      }

      // 2. Also emit via Socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit(isSpoken ? 'student:speak' : 'student:question', {
          roomId: roomCode,
          room: roomCode,
          ...questionPayload
        })
      }

      toast(
        isSpoken
          ? '🎙️ Spoken doubt sent to teacher (translated to Hindi in real-time)'
          : 'Question sent to teacher (translated to Hindi in real-time)',
        'success'
      )
      setStudentQuestionText('')
      if (isFloorSpeaking) {
        handleStudentFinishSpeaking()
      }
    } catch {
      toast('Failed to submit question. Please try again.', 'error')
    }
  }

  // Teacher answers student's question (supports typed and spoken voice replies)
  const handleTeacherAnswer = async (questionId: string, customAnswerText?: string) => {
    const answerText = customAnswerText || teacherAnswerInputs[questionId]
    if (!answerText || !answerText.trim()) {
      toast('Please enter or speak an answer to reply', 'error')
      return
    }

    const isVoiceReply = replyingVoiceId === questionId
    if (replyingVoiceId) {
      try { teacherReplyRecRef.current?.stop() } catch {}
      setReplyingVoiceId(null)
    }

    try {
      // 1. Call REST API
      const res = await classroomApi.answerQuestion(roomCode, {
        questionId,
        text: answerText.trim()
      })

      // 2. Emit socket event
      if (socketRef.current) {
        socketRef.current.emit(isVoiceReply ? 'teacher:voice_reply' : 'teacher:answer', {
          roomId: roomCode,
          room: roomCode,
          questionId,
          text: answerText.trim(),
          isVoice: isVoiceReply
        })
      }

      setStudentQuestions(prev =>
        prev.map(q => q.id === questionId ? { ...q, answer: res.answer, answered: true } : q)
      )
      setTeacherAnswerInputs(prev => ({ ...prev, [questionId]: '' }))
      toast('Answer translated and delivered to student with audio!', 'success')
    } catch {
      toast('Failed to send answer', 'error')
    }
  }

  // Student changes mother tongue dialect
  const handleLanguageChange = async (newLangName: string) => {
    const matched = languagesList.find(l => l.name === newLangName || l.language_name === newLangName)
    const code = matched?.code || matched?.language_code || 'sat'

    setStudentLanguage(newLangName)
    setPreferredLanguage(newLangName)

    try {
      await studentApi.updateLanguage(code)
    } catch {
      // In-memory fallback
    }

    if (socketRef.current) {
      socketRef.current.emit('change_language', { language: newLangName })
    }
    toast(`Mother tongue switched to ${newLangName}`, 'info')
  }

  // Toggle autoPlay preference
  const handleAutoPlayChange = async (checked: boolean) => {
    setAutoPlayAudio(checked)
    try {
      await studentApi.updatePreferences({ autoPlay: checked })
    } catch {
      // In-memory fallback
    }
    toast(`Auto-play speech audio ${checked ? 'enabled' : 'disabled'}`, 'info')
  }

  // Audio Playback with Stream Proxy & Phonetic Fallback
  const playAudio = (
    audioUrl?: string | null,
    textFallback?: string,
    phoneticFallback?: string,
    hindiFallback?: string
  ) => {
    setIsPlayingAudio(true)

    // Stop previous playback if currently playing
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause()
        audioPlayerRef.current.currentTime = 0
      } catch {}
    }

    // Determine audio stream source
    let resolvedUrl = ''
    if (audioUrl) {
      resolvedUrl = speechApi.resolveAudioUrl(audioUrl)
    } else {
      resolvedUrl = speechApi.getStreamUrl(
        textFallback || '',
        studentLanguage,
        phoneticFallback || ''
      )
    }

    const player = new Audio(resolvedUrl)
    audioPlayerRef.current = player

    player.onended = () => {
      setIsPlayingAudio(false)
    }

    player.onerror = () => {
      console.warn('Audio streaming failed, switching to phonetic browser speech fallback')
      fallbackBrowserSpeak(phoneticFallback || hindiFallback || textFallback || '')
    }

    player.play().catch(err => {
      console.warn('Direct audio play error, falling back to speech synthesis:', err)
      fallbackBrowserSpeak(phoneticFallback || hindiFallback || textFallback || '')
    })
  }

  const fallbackBrowserSpeak = (text: string) => {
    if (!text) {
      setIsPlayingAudio(false)
      return
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.92

      const voices = window.speechSynthesis.getVoices()
      const indVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('india'))
      if (indVoice) utterance.voice = indVoice

      utterance.onend = () => setIsPlayingAudio(false)
      utterance.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
    } else {
      setIsPlayingAudio(false)
    }
  }

  return (
    <section className="page-card classroom-page">
      {/* Top Header & Session Status */}
      <div className="page-intro">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">REAL-TIME MULTILINGUAL CLASSROOM</span>

            {/* Item 1: Real Socket.IO connection status */}
            <span
              id="socket-status-badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                  : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              {connectionStatus === 'CONNECTED' && '🟢 Socket Live (CONNECTED)'}
              {connectionStatus === 'CONNECTING' && '🟡 CONNECTING...'}
              {connectionStatus === 'RECONNECTING' && '🔄 RECONNECTING...'}
              {connectionStatus === 'DISCONNECTED' && '🔴 DISCONNECTED'}
            </span>
          </div>

          {/* Item 2: Dynamic Room & Student count */}
          <h1 className="flex flex-wrap items-center gap-3">
            Room: {roomCode.toUpperCase()}
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-lg border transition-colors ${
                teacherOnline
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {teacherOnline
                ? `${studentCount} ${studentCount === 1 ? 'student' : 'students'} connected`
                : `${studentCount} ${studentCount === 1 ? 'student waiting (You)' : 'students waiting'} • Teacher Offline`}
            </span>
          </h1>

          <p>
            {mode === 'teacher'
              ? 'Speak or broadcast lessons in Hindi; students instantly receive speech & captions in Santhali, Mundari, Ho, or Kurukh.'
              : 'Listen to your teacher in your native mother tongue with real-time text and speech audio.'}
          </p>
        </div>

        {/* Role Badge (Strict Role Separation - No client-side switcher) */}
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-sm flex items-center gap-2">
            {isTeacher ? '👩🏾‍🏫 Teacher Station' : '👦🏽 Student Screen'}
          </span>
        </div>
      </div>

      {/* Teacher Offline Banner if teacher disconnects */}
      {!teacherOnline && (
        <div className="mt-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <strong className="text-sm block">Live Classroom Offline (Teacher Not Broadcasting)</strong>
            <p className="text-xs text-amber-700">
              The teacher is currently offline. You are connected to Room {roomCode.toUpperCase()} ({studentCount} student waiting in lobby). You can review past translation history or post questions below.
            </p>
          </div>
        </div>
      )}

      {/* TEACHER MODE VIEW */}
      {mode === 'teacher' && (
        <div className="space-y-6 mt-6">
          {/* Teacher Room Management Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Room Status:</span>
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-bold font-mono">
                ROOM: {roomCode.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isRoomActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {isRoomActive ? '● Session Active' : '○ Inactive'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleStartClass}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                ▶ Start Class
              </button>
              <button
                type="button"
                onClick={handleEndClass}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                ⏹ End Class
              </button>
              <form onSubmit={handleCreateRoom} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="New Room Code"
                  value={newRoomCode}
                  onChange={e => setNewRoomCode(e.target.value.toUpperCase())}
                  className="w-32 px-2.5 py-1 text-xs border border-slate-300 rounded-lg uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newRoomCode.trim()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg whitespace-nowrap"
                >
                  + Create
                </button>
              </form>
            </div>
          </div>

          {/* Microphone & Broadcast Bar */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={isRecording ? 'Stop microphone' : 'Start microphone'}
                  onClick={toggleSpeechRecognition}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  }`}
                >
                  {isRecording ? <MicOff size={26} /> : <Mic size={26} />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-base text-white">
                      {isRecording ? `Listening live in ${teacherSourceLanguage}...` : 'Teacher Microphone'}
                    </strong>
                    {isRecording && <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40">ON AIR</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <label htmlFor="teacher-mic-lang-select" className="text-xs text-indigo-300 font-medium">Source Language:</label>
                    <select
                      id="teacher-mic-lang-select"
                      value={teacherSourceLanguage}
                      onChange={(e) => setTeacherSourceLanguage(e.target.value)}
                      className="bg-indigo-950/90 text-amber-300 border border-indigo-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="Hindi">🇮🇳 Hindi (हिन्दी)</option>
                      <option value="English">🌐 English</option>
                      <option value="Bengali">🇧🇩 Bengali (বাংলা)</option>
                      <option value="Odia">🇮🇳 Odia (ଓଡ଼ᱤଆ)</option>
                      <option value="Santhali">🪶 Santhali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                      <option value="Kurukh">🌿 Kurukh (कुड़ुख़)</option>
                    </select>
                    <span className="text-[11px] text-indigo-200/70 hidden sm:inline">
                      Click mic to speak in {teacherSourceLanguage} or type below to broadcast.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handleTeacherBroadcast}
                  className="w-full lg:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Radio size={16} /> Broadcast to Classroom
                </button>
              </div>
            </div>

            {/* Input / Live Transcript area */}
            <div className="relative">
              <textarea
                value={teacherInput}
                onChange={e => setTeacherInput(e.target.value)}
                placeholder={
                  teacherSourceLanguage === 'English'
                    ? 'Type or speak in English: "Hello students! Today we will learn about plants and photosynthesis..."'
                    : `Type or speak in ${teacherSourceLanguage}: "नमस्ते बच्चों! आज हम पौधों के बारे में सीखेंगे..."`
                }
                rows={3}
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Preset Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-indigo-300 font-medium">Quick Class Presets:</span>
              {teacherSourceLanguage === 'English' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handlePresetBroadcast('Hello students! Today we will learn about plants and photosynthesis.')}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    🌱 About Plants (Science)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetBroadcast('Plants need water, sunlight and carbon dioxide to make their own food.')}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    💧 Sunlight & Water (Biology)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetBroadcast('Birsa Munda was a legendary tribal freedom fighter and national hero of Jharkhand.')}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    🏹 Birsa Munda (History)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handlePresetBroadcast('नमस्ते बच्चों! आज हम पौधों और प्रकाश संश्लेषण के बारे में सीखेंगे।')}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    🌱 पौधों के बारे में (Science)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetBroadcast('पौधों को भोजन बनाने के लिए पानी, धूप और हवा की आवश्यकता होती है।')}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    💧 जल और धूप (Photosynthesis)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetBroadcast('बिरसा मुंडा झारखंड के महान स्वतंत्रता सेनानी और जननायक थे।')}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    🏹 बिरसा मुंडा (History)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Multilingual Parallel Broadcast Board */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="eyebrow">PARALLEL TRANSLATION MATRIX</span>
                <h3 className="text-lg font-bold text-slate-900">Active Classroom Dialect Streams</h3>
              </div>
              <span className="text-xs text-slate-500">
                {lastBroadcast ? `Last broadcast: ${new Date(lastBroadcast.timestamp).toLocaleTimeString()}` : 'Awaiting speech'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Santhali Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-900 text-sm">Santhali / ᱥᱟᱱᱛᱟᱲᱤ</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">Ol Chiki</span>
                </div>
                <p className="text-emerald-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Santhali?.text || 'ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱨᱮ-ᱱᱟᱹᱲᱤ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾'}
                </p>
                <p className="text-xs text-emerald-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Santhali?.phonetic || "Teheñ do abo dare-nari babat bon seṛaya."}&rdquo;
                </p>
              </div>

              {/* Mundari Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-900 text-sm">Mundari / ᱢᱩᱱᱰᱟᱨᱤ</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">Mundari Bani</span>
                </div>
                <p className="text-amber-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Mundari?.text || 'ᱛᱤᱥᱤᱝ ᱵᱩ ᱫᱟᱨᱩ-ᱢᱟᱴᱤ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ᱾'}
                </p>
                <p className="text-xs text-amber-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Mundari?.phonetic || "Tising bu daru-mati itun lagid."}&rdquo;
                </p>
              </div>

              {/* Ho Card */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sky-900 text-sm">Ho / ᱦᱳ</span>
                  <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded font-mono">Warang Citi</span>
                </div>
                <p className="text-sky-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Ho?.text || 'ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱫᱟᱨᱩ ᱠᱳ ᱤᱛᱩᱱᱟᱱ᱾'}
                </p>
                <p className="text-xs text-sky-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Ho?.phonetic || "Tising abu daru ko itunan."}&rdquo;
                </p>
              </div>

              {/* Kurukh Card */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-900 text-sm">Kurukh / कुड़ुख़</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono">Tolong Siki</span>
                </div>
                <p className="text-purple-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Kurukh?.text || 'इन्ना ऎम मन्न-खोड़ोर बारॆते खॊड़\'ओर।'}
                </p>
                <p className="text-xs text-purple-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Kurukh?.phonetic || "Inna em mann-khor'or barete khor'or."}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Student Questions & Engagement Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Student Question Inbox with Answer capability (Items 10 & 11) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" />
                  <strong className="text-slate-900 text-base">Student Questions & Doubts</strong>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                  {studentQuestions.length} Received
                </span>
              </div>

              {studentQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No questions asked yet. When students ask questions in Santhali, Mundari, Ho, or Kurukh, they appear here translated automatically into Hindi for you to answer.
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {studentQuestions.map(q => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{q.studentName}</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                            {q.originalLanguage}
                          </span>
                          {q.isVoice && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Mic size={10} className="text-rose-600 animate-pulse" /> Spoken Voice Doubt
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{new Date(q.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <div className="text-slate-600">
                        <strong className="text-slate-700">Original ({q.originalLanguage}):</strong> &ldquo;{q.originalText}&rdquo;
                      </div>

                      <div className="text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-[11px] text-emerald-900 mb-0.5">Hindi Translation for Teacher:</strong>
                          <p className="text-sm text-emerald-950 font-bold">&ldquo;{q.hindiTranslation}&rdquo;</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => playAudio(q.audioUrl, q.hindiTranslation, q.phonetic, q.originalText)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                          title="Listen to student question in Hindi"
                        >
                          <Volume2 size={13} /> Listen
                        </button>
                      </div>

                      {/* Answer section */}
                      {q.answer ? (
                        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-indigo-900 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-indigo-950 font-bold text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-600" /> Your Answer (Delivered to Student):
                            </strong>
                            <button
                              type="button"
                              onClick={() => playAudio(q.answer.audioUrl, q.answer.translatedAnswer, q.answer.phonetic, q.answer.teacherText)}
                              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 p-1"
                              title="Listen to translated answer"
                            >
                              <Volume2 size={13} /> Listen Vernacular
                            </button>
                          </div>
                          <p className="text-xs text-slate-800">&ldquo;{q.answer.teacherText || q.answer.hindiAnswer}&rdquo;</p>
                          <div className="p-2 bg-white rounded-lg border border-indigo-100 text-emerald-900">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Translated to {q.originalLanguage}:</span>
                            <span className="text-xs font-bold font-sans">{q.answer.translatedAnswer}</span>
                            {q.answer.phonetic && (
                              <p className="text-[10px] text-indigo-600 italic mt-0.5 font-mono">
                                Pronunciation: &ldquo;{q.answer.phonetic}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          {/* Quick preset response chips */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-semibold">Quick Reply:</span>
                            {quickTeacherReplies.map((chip, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleTeacherAnswer(q.id, chip)}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200 transition-all font-medium active:scale-95"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={teacherAnswerInputs[q.id] || ''}
                              onChange={e => setTeacherAnswerInputs({ ...teacherAnswerInputs, [q.id]: e.target.value })}
                              placeholder={`Reply to ${q.studentName} in Hindi (auto-translated to ${q.originalLanguage})...`}
                              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleTeacherAnswer(q.id)
                                }
                              }}
                            />
                            {/* Voice Reply Mic Button */}
                            <button
                              type="button"
                              onClick={() => toggleTeacherReplyMic(q.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                replyingVoiceId === q.id
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                              title={replyingVoiceId === q.id ? 'Stop Voice Recording' : 'Speak Reply in Hindi'}
                            >
                              <Mic size={13} />
                              {replyingVoiceId === q.id ? 'Listening...' : 'Voice Reply'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTeacherAnswer(q.id)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-all active:scale-95"
                            >
                              Reply to Student
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hand Raises with Action Buttons (Item 12) & Connected Students */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hand size={18} className="text-amber-500" />
                    <strong className="text-slate-900 text-sm">Hand Raises</strong>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    {handRaises.length}
                  </span>
                </div>
                {handRaises.length === 0 ? (
                  <p className="text-xs text-slate-400">No raised hands currently.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {handRaises.map((h, i) => (
                      <li key={i} className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span>✋ {h.studentName} wants to speak</span>
                          <span className="text-[10px] text-amber-700">{new Date(h.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleTeacherAllowSpeak(h.studentName)}
                            className="flex-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-sm"
                          >
                            Allow to Speak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTeacherDismissHand(h.studentName)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg"
                          >
                            Dismiss
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Connected Students Roster */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-indigo-600" />
                  <strong className="text-slate-900 text-sm">Connected Students ({studentCount})</strong>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(roomState?.students || []).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                        {s.preferredLanguage || 'Santhali'}
                      </span>
                    </div>
                  ))}
                  {(!roomState?.students || roomState.students.length === 0) && (
                    <p className="text-xs text-slate-400">Waiting for students to join room {roomCode.toUpperCase()}...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MODE VIEW */}
      {mode === 'student' && (
        <div className="space-y-6 mt-6">
          {/* Student Room Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected Room:</span>
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-bold font-mono">
                ROOM: {roomCode.toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${teacherOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {teacherOnline ? 'Teacher Online' : 'Teacher Offline'}
              </span>
            </div>

            <form onSubmit={handleJoinRoom} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter Room Code (e.g. MAIN)"
                value={joinRoomCode}
                onChange={e => setJoinRoomCode(e.target.value.toUpperCase())}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg uppercase font-mono w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!joinRoomCode.trim()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-sm transition-all"
              >
                Join Room
              </button>
            </form>
          </div>

          {/* Dialect Selector & Audio Preferences (Items 3 & 9) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Languages size={20} className="text-indigo-600" />
              <div>
                <strong className="text-sm text-slate-900 block">Listening in Mother Tongue</strong>
                <span className="text-xs text-slate-500">Choose the regional dialect you learn in best</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Dynamic Languages Dropdown (Item 3) */}
              <select
                value={studentLanguage}
                onChange={e => handleLanguageChange(e.target.value)}
                className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {languagesList.map(l => (
                  <option key={l.code || l.language_code} value={l.name || l.language_name}>
                    {l.native || l.name} {l.script ? `(${l.script})` : ''}
                  </option>
                ))}
              </select>

              {/* Auto-Play speech audio checkbox (Item 9) */}
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none bg-white/80 px-3 py-2 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={e => handleAutoPlayChange(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                ☑ Auto-play speech audio
              </label>
            </div>
          </div>

          {/* Large Live Vernacular Blackboard (Item 6) */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-2xl p-6 lg:p-8 shadow-xl border border-indigo-900/60 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  LIVE MOTHER TONGUE BROADCAST • {studentLanguage.toUpperCase()}
                </span>
              </div>

              {/* Play Audio Button (Item 8) */}
              <button
                type="button"
                onClick={() => playAudio(receivedAudioUrl, receivedTranslation, receivedPhonetic, receivedCaption)}
                disabled={isPlayingAudio}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                  isPlayingAudio
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title="Play Audio"
              >
                <Volume2 size={16} className={isPlayingAudio ? 'animate-bounce' : ''} />
                {isPlayingAudio ? '🔊 Playing Audio...' : '🔊 Play Audio'}
              </button>
            </div>

            {/* Native Script Display */}
            <div className="my-6">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-wide text-white leading-relaxed font-sans">
                {receivedTranslation}
              </h2>
              {receivedPhonetic && (
                <p className="mt-3 text-sm text-indigo-300 font-mono italic">
                  Pronunciation: &ldquo;{receivedPhonetic}&rdquo;
                </p>
              )}
            </div>

            {/* Teacher's Original Spoken Hindi */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-3">
              <span className="text-xs text-amber-400 uppercase tracking-wider font-bold whitespace-nowrap">
                TEACHER SPOKE (HINDI):
              </span>
              <p className="text-sm text-slate-200 italic">
                &ldquo;{receivedCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* Translation History (Item 7) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" />
                <strong className="text-slate-900 text-sm">Translation History</strong>
              </div>
              <span className="text-xs text-slate-500">
                {translationHistory.length} sentences recorded
              </span>
            </div>

            {translationHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No previous translations in this session.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {translationHistory.map((item, idx) => {
                  const vernacularText =
                    item.translations?.[studentLanguage]?.text ||
                    item.translations?.Santhali?.text ||
                    item.teacherText ||
                    item.sourceText

                  return (
                    <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-semibold text-indigo-700">Teacher Spoke:</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="text-slate-800 font-medium">&ldquo;{item.teacherText || item.sourceText}&rdquo;</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-emerald-800">
                        <strong className="text-xs">{studentLanguage}: {vernacularText}</strong>
                        <button
                          type="button"
                          onClick={() => playAudio(
                            item.translations?.[studentLanguage]?.audioUrl,
                            vernacularText,
                            item.translations?.[studentLanguage]?.phonetic,
                            item.teacherText || item.sourceText
                          )}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          title="Listen"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Student Interaction Desk: Q&A, Voice Doubt & Raise Hand Floor Intercom */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ask Doubt in Mother Tongue (Text & Voice Input) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-600" />
                  <strong className="text-slate-900 text-sm">Ask Teacher a Question in {studentLanguage}</strong>
                </div>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  Two-Way Live Q&A
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Type or <strong>speak into your microphone</strong> in {studentLanguage}. The platform automatically translates your doubt into Hindi for your teacher, and speaks their reply back to you in your mother tongue!
              </p>

              <form onSubmit={handleStudentQuestion} className="space-y-3">
                <div className="relative">
                  <textarea
                    value={studentQuestionText}
                    onChange={e => setStudentQuestionText(e.target.value)}
                    placeholder={`Write or click the mic to speak in ${studentLanguage} (e.g. 'Mujhe photosynthesis samajh nahi aaya')...`}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {isStudentRecordingDoubt && (
                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-rose-600 text-[11px] font-bold bg-white/90 px-2 py-0.5 rounded-md border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      Listening in {studentLanguage}...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-between">
                  {/* Student Voice Doubt Mic Button */}
                  <button
                    type="button"
                    onClick={toggleStudentDoubtMic}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                      isStudentRecordingDoubt
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Mic size={14} className={isStudentRecordingDoubt ? 'animate-bounce' : ''} />
                    {isStudentRecordingDoubt ? '🔴 Stop Voice Recording' : `🎙️ Speak Doubt in ${studentLanguage}`}
                  </button>

                  <button
                    type="submit"
                    disabled={!studentQuestionText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Send size={14} /> Send Question to Teacher
                  </button>
                </div>
              </form>

              {/* My Questions & Teacher Answers list */}
              {myQuestions.length > 0 && (
                <div className="pt-2 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Your Submitted Questions:</span>
                  {myQuestions.map(q => (
                    <div key={q.id} className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">You asked ({q.originalLanguage}):</span>
                          {q.isVoice && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Mic size={10} className="text-rose-600" /> Voice Doubt
                            </span>
                          )}
                        </div>
                        <span className="text-[10px]">{new Date(q.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium">&ldquo;{q.originalText}&rdquo;</p>
                      <p className="text-[11px] text-indigo-800 italic">Translated for Teacher: &ldquo;{q.hindiTranslation}&rdquo;</p>

                      {q.answer ? (
                        <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <strong className="block font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-700" />
                              Teacher&apos;s Answer in {studentLanguage}:
                            </strong>
                            <button
                              type="button"
                              onClick={() => playAudio(q.answer.audioUrl, q.answer.translatedAnswer, q.answer.phonetic, q.answer.teacherText)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                              title="Listen to teacher answer"
                            >
                              <Volume2 size={13} /> Listen
                            </button>
                          </div>
                          <p className="text-sm font-bold text-emerald-950 leading-relaxed font-sans">
                            {q.answer.translatedAnswer || q.answer.teacherText}
                          </p>
                          {q.answer.phonetic && (
                            <p className="text-[11px] text-emerald-800 italic font-mono">
                              Pronunciation: &ldquo;{q.answer.phonetic}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-emerald-700 italic border-t border-emerald-200 pt-1">
                            Teacher spoke in Hindi: &ldquo;{q.answer.teacherText || q.answer.hindiAnswer}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 pt-1">
                          <Clock size={12} className="animate-spin" /> Waiting for teacher to answer...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Raise Hand & Live Voice Floor Intercom */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hand size={18} className="text-amber-500" />
                  <strong className="text-slate-900 text-sm">Need Help & Floor Intercom</strong>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Raise your hand to request speaking permission. Once granted, your live microphone floor unlocks.
                </p>

                {/* Active Floor Speaking Card */}
                {isAllowedToSpeak && (
                  <div className="mb-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs flex items-center gap-1.5 text-emerald-900 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        🎤 YOU HAVE THE FLOOR!
                      </strong>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                        ACTIVE MIC
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Teacher granted you permission to speak. Click below to talk live to the classroom in your mother tongue!
                    </p>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={toggleFloorSpeaking}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                          isFloorSpeaking
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Mic size={15} />
                        {isFloorSpeaking ? '🔴 Speaking Live... (Tap to Pause)' : '🎙️ Start Speaking Live'}
                      </button>

                      {studentQuestionText.trim() && (
                        <button
                          type="button"
                          onClick={() => handleStudentQuestion(undefined, studentQuestionText, true)}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Send Question to Teacher
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleStudentFinishSpeaking}
                        className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold transition-all"
                      >
                        Release Floor / Mute
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isAllowedToSpeak && (
                <button
                  type="button"
                  onClick={handleRaiseHand}
                  disabled={isHandRaised}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isHandRaised
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 cursor-default'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 active:scale-95'
                  }`}
                >
                  <Hand size={16} />
                  {isHandRaised ? '✋ Hand Raised (Waiting for teacher...)' : '✋ Raise My Hand'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
