import { useEffect, useRef, useState } from 'react'
import { Check, Hand, Headphones, HelpCircle, Languages, MessageSquare, Mic, MicOff, Play, Radio, Send, Users, Volume2, Sparkles, AlertCircle } from 'lucide-react'
import { createClassroomSocketIO, classroomApi, type Role, type RoomState, type StudentQuestion } from './api'
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
  sourceLanguage: string
  translations: Record<string, MultilingualTranslation>
  timestamp: string
}

export default function GoogleClassroomPage({ role }: { role: Role }) {
  const { userName, preferredLanguage, setPreferredLanguage, activeRoom, toast } = useApp()
  const [mode, setMode] = useState<'teacher' | 'student'>(role === 'student' ? 'student' : 'teacher')
  const [roomCode, setRoomCode] = useState(activeRoom || 'main')
  const [isConnected, setIsConnected] = useState(false)
  const [roomState, setRoomState] = useState<RoomState | null>(null)

  // Teacher states
  const [teacherInput, setTeacherInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [lastBroadcast, setLastBroadcast] = useState<BroadcastMessage | null>(null)
  const [studentQuestions, setStudentQuestions] = useState<StudentQuestion[]>([])
  const [handRaises, setHandRaises] = useState<Array<{ studentName: string; timestamp: string }>>([])

  // Student states
  const [studentLanguage, setStudentLanguage] = useState(preferredLanguage || 'Santhali')
  const [receivedCaption, setReceivedCaption] = useState('Waiting for teacher to speak...')
  const [receivedTranslation, setReceivedTranslation] = useState('Translated vernacular speech will appear here.')
  const [receivedPhonetic, setReceivedPhonetic] = useState('')
  const [receivedAudioUrl, setReceivedAudioUrl] = useState<string | null>(null)
  const [studentQuestionText, setStudentQuestionText] = useState('')
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [autoPlayAudio, setAutoPlayAudio] = useState(true)

  const socketRef = useRef<Socket | null>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = createClassroomSocketIO({
      roomCode,
      role: mode,
      name: userName,
      preferredLanguage: studentLanguage
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('room:state', (state: RoomState) => {
      setRoomState(state)
      if (state.recentTranscripts && state.recentTranscripts.length > 0) {
        const latest = state.recentTranscripts[state.recentTranscripts.length - 1]
        setLastBroadcast({
          id: latest.id,
          sourceText: latest.sourceText,
          sourceLanguage: latest.sourceLanguage,
          translations: latest.translations || {},
          timestamp: latest.timestamp
        })

        if (latest.translations && latest.translations[studentLanguage]) {
          setReceivedCaption(latest.sourceText)
          setReceivedTranslation(latest.translations[studentLanguage].text)
          setReceivedPhonetic(latest.translations[studentLanguage].phonetic || '')
          setReceivedAudioUrl(latest.translations[studentLanguage].audioUrl || null)
        }
      }
    })

    socket.on('teacher:status', ({ online, name }: { online: boolean; name?: string }) => {
      setRoomState(prev => prev ? { ...prev, teacherOnline: online, teacherName: name || prev.teacherName } : null)
      if (online) {
        toast(`Teacher ${name || ''} is now broadcasting in Room ${roomCode}`, 'info')
      }
    })

    socket.on('student:joined', ({ name, preferredLanguage: lang }: { name: string; preferredLanguage: string }) => {
      toast(`${name} joined class (${lang})`, 'info')
      setRoomState(prev => {
        if (!prev) return prev
        return {
          ...prev,
          studentCount: prev.studentCount + 1,
          students: [...prev.students.filter(s => s.name !== name), { name, preferredLanguage: lang }]
        }
      })
    })

    socket.on('student:left', ({ student }: { student: any }) => {
      if (student?.name) {
        setRoomState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            studentCount: Math.max(0, prev.studentCount - 1),
            students: prev.students.filter(s => s.name !== student.name)
          }
        })
      }
    })

    // General broadcast with all translations
    socket.on('classroom:broadcast', (record: BroadcastMessage) => {
      setLastBroadcast(record)
      if (mode === 'student' && record.translations && record.translations[studentLanguage]) {
        const tr = record.translations[studentLanguage]
        setReceivedCaption(record.sourceText)
        setReceivedTranslation(tr.text)
        setReceivedPhonetic(tr.phonetic || '')
        setReceivedAudioUrl(tr.audioUrl || null)

        if (autoPlayAudio) {
          playAudio(tr.audioUrl, tr.text)
        }
      }
    })

    // Targeted delivery for this student's dialect
    socket.on('classroom:speech_translated', (data: {
      id: string
      sourceText: string
      sourceLanguage: string
      language: string
      translatedText: string
      phoneticText?: string
      audioUrl?: string
    }) => {
      if (data.language.toLowerCase() === studentLanguage.toLowerCase()) {
        setReceivedCaption(data.sourceText)
        setReceivedTranslation(data.translatedText)
        setReceivedPhonetic(data.phoneticText || '')
        setReceivedAudioUrl(data.audioUrl || null)

        if (autoPlayAudio) {
          playAudio(data.audioUrl, data.translatedText)
        }
      }
    })

    // Student questions (teacher view)
    socket.on('classroom:student_question', (question: StudentQuestion) => {
      setStudentQuestions(prev => [question, ...prev])
      toast(`Question from ${question.studentName} (${question.originalLanguage})`, 'info')
    })

    // Hand raises
    socket.on('classroom:hand_raised', (alert: { studentName: string; timestamp: string }) => {
      setHandRaises(prev => [alert, ...prev.slice(0, 9)])
      toast(`✋ ${alert.studentName} raised their hand!`, 'info')
    })

    return () => {
      socket.disconnect()
    }
  }, [roomCode, mode, studentLanguage, userName])

  // Browser speech recognition for teacher
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast('Speech Recognition is not supported by your browser. You can type and broadcast below.', 'info')
      setTeacherInput('नमस्ते बच्चों! आज हम जल चक्र (Water Cycle) के बारे में विस्तार से सीखेंगे।')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'hi-IN'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsRecording(true)
        toast('Classroom microphone active. Speak Hindi naturally.', 'success')
      }

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        setTeacherInput(transcript)
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.error(err)
      setIsRecording(false)
    }
  }

  // Teacher submits speech broadcast
  const handleTeacherBroadcast = () => {
    if (!teacherInput.trim()) {
      toast('Please enter or speak a phrase to broadcast', 'error')
      return
    }

    if (socketRef.current) {
      socketRef.current.emit('teacher:speech', {
        room: roomCode,
        text: teacherInput.trim(),
        sourceLanguage: 'Hindi'
      })
      toast('Broadcasting and translating to all vernacular dialects...', 'info')
    }
  }

  // Quick preset phrases for teachers
  const handlePresetBroadcast = (text: string) => {
    setTeacherInput(text)
    if (socketRef.current) {
      socketRef.current.emit('teacher:speech', {
        room: roomCode,
        text,
        sourceLanguage: 'Hindi'
      })
      toast('Broadcasting phrase to classroom...', 'info')
    }
  }

  // Student raises hand
  const handleRaiseHand = () => {
    if (socketRef.current) {
      socketRef.current.emit('student:raise_hand')
      setIsHandRaised(true)
      toast('Hand raised! Teacher has been notified.', 'success')
      setTimeout(() => setIsHandRaised(false), 5000)
    }
  }

  // Student asks question in regional dialect
  const handleStudentQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentQuestionText.trim()) return

    if (socketRef.current) {
      socketRef.current.emit('student:question', {
        room: roomCode,
        studentName: userName,
        text: studentQuestionText.trim(),
        language: studentLanguage
      })
      toast('Question sent to teacher (translated to Hindi)', 'success')
      setStudentQuestionText('')
    }
  }

  // Student changes dialect
  const handleLanguageChange = (newLang: string) => {
    setStudentLanguage(newLang)
    setPreferredLanguage(newLang)
    if (socketRef.current) {
      socketRef.current.emit('change_language', { language: newLang })
    }
    toast(`Listening dialect switched to ${newLang}`, 'info')
  }

  const playAudio = (audioUrl?: string | null, textFallback?: string) => {
    if (audioUrl) {
      const player = new Audio(audioUrl)
      player.play().catch(() => {
        fallbackBrowserSpeak(textFallback || '')
      })
    } else if (textFallback) {
      fallbackBrowserSpeak(textFallback)
    }
  }

  const fallbackBrowserSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  const availableLanguages = [
    { name: 'Santhali', native: 'ᱥᱟᱱᱛᱟᱲᱤ (Ol Chiki)', code: 'sat' },
    { name: 'Mundari', native: 'ᱢᱩᱱᱰᱟᱨᱤ (Mundari Bani)', code: 'unr' },
    { name: 'Ho', native: 'ᱦᱳ (Warang Citi)', code: 'hoc' },
    { name: 'Kurukh', native: 'कुड़ुख़ (Tolong Siki)', code: 'kru' },
    { name: 'English', native: 'English (Latin)', code: 'en' }
  ]

  return (
    <section className="page-card classroom-page">
      {/* Top Header & Session Status */}
      <div className="page-intro">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">REAL-TIME MULTILINGUAL CLASSROOM</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Socket Live' : 'Connecting...'}
            </span>
          </div>
          <h1 className="flex items-center gap-3">
            Room: {roomCode.toUpperCase()}
            <span className="text-sm font-normal text-slate-500 px-3 py-1 bg-slate-100 rounded-lg">
              {roomState?.studentCount || 0} students connected
            </span>
          </h1>
          <p>
            {mode === 'teacher'
              ? 'Speak or broadcast lessons in Hindi; students instantly receive speech & captions in Santhali, Mundari, Ho, or Kurukh.'
              : 'Listen to your teacher in your native mother tongue with real-time text and speech audio.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('teacher')}
          >
            👩🏾‍🏫 Teacher Broadcast
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('student')}
          >
            👦🏽 Student Screen
          </button>
        </div>
      </div>

      {/* TEACHER MODE VIEW */}
      {mode === 'teacher' && (
        <div className="space-y-6 mt-6">
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
                      {isRecording ? 'Listening live in Hindi...' : 'Teacher Microphone'}
                    </strong>
                    {isRecording && <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40">ON AIR</span>}
                  </div>
                  <span className="text-xs text-indigo-200">
                    Click mic to transcribe spoken Hindi or type below to broadcast across all vernaculars.
                  </span>
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
                placeholder="Type or speak in Hindi: 'नमस्ते बच्चों! आज हम जल चक्र (Water Cycle) के बारे में विस्तार से सीखेंगे...'"
                rows={3}
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Preset Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-indigo-300 font-medium">Quick Class Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetBroadcast('नमस्ते बच्चों! आज हम जल चक्र (Water Cycle) और वर्षा के बारे में सीखेंगे।')}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                💧 जल चक्र (Water Cycle)
              </button>
              <button
                type="button"
                onClick={() => handlePresetBroadcast('पेड़-पौधे और जंगल हमारे सबसे बड़े मित्र हैं। वे हमें ताज़ी हवा देते हैं।')}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                🌳 वन मित्र (EVS)
              </button>
              <button
                type="button"
                onClick={() => handlePresetBroadcast('बिरसा मुंडा झारखंड के महान स्वतंत्रता सेनानी और जननायक थे।')}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-indigo-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                🏹 बिरसा मुंडा (History)
              </button>
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
                  {lastBroadcast?.translations?.Santhali?.text || 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ! ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾'}
                </p>
                <p className="text-xs text-emerald-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Santhali?.phonetic || "Johar gidra! Da' chakra babat bon seṛaya."}&rdquo;
                </p>
              </div>

              {/* Mundari Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-900 text-sm">Mundari / ᱢᱩᱱᱰᱟᱨᱤ</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">Mundari Bani</span>
                </div>
                <p className="text-amber-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Mundari?.text || 'ᱡᱳᱦᱟᱨ ᱦᱩᱲᱤᱝ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱵᱩ ᱫᱟᱜ ᱠᱟᱱᱰᱟ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ᱾'}
                </p>
                <p className="text-xs text-amber-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Mundari?.phonetic || "Johar huring ko! Tising bu da' kanda itun lagid."}&rdquo;
                </p>
              </div>

              {/* Ho Card */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sky-900 text-sm">Ho / ᱦᱳ</span>
                  <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded font-mono">Warang Citi</span>
                </div>
                <p className="text-sky-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Ho?.text || 'ᱡᱳᱦᱟᱨ ᱦᱳᱱ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱤᱛᱩᱱᱟᱱ᱾'}
                </p>
                <p className="text-xs text-sky-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Ho?.phonetic || "Johar hon ko! Tising abu da' chakra itunan."}&rdquo;
                </p>
              </div>

              {/* Kurukh Card */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-900 text-sm">Kurukh / कुड़ुख़</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono">Tolong Siki</span>
                </div>
                <p className="text-purple-950 font-medium text-base mb-2 min-h-[50px]">
                  {lastBroadcast?.translations?.Kurukh?.text || 'गॊडे लगदन खोड़ोर! इन्ना ऎम अम् चक्रा बारॆते खॊड़\'ओर।'}
                </p>
                <p className="text-xs text-purple-700 italic">
                  Phonetic: &ldquo;{lastBroadcast?.translations?.Kurukh?.phonetic || "Gode lagdan khor'or! Inna em am chakra barete khor'or."}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Student Questions & Engagement Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Student Question Inbox */}
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
                  No questions asked yet. When students ask questions in Santhali, Mundari, Ho, or Kurukh, they appear here translated automatically into Hindi.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {studentQuestions.map(q => (
                    <div key={q.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-slate-900">{q.studentName} ({q.originalLanguage})</span>
                        <span>{new Date(q.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-600">
                        <strong className="text-slate-700">Original ({q.originalLanguage}):</strong> &ldquo;{q.originalText}&rdquo;
                      </div>
                      <div className="text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <strong>Hindi Translation for Teacher:</strong> &ldquo;{q.hindiTranslation}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hand Raises & Attendance Roster */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hand size={18} className="text-amber-500" />
                    <strong className="text-slate-900 text-sm">Hand Raises</strong>
                  </div>
                  <span className="text-xs text-slate-500">{handRaises.length}</span>
                </div>
                {handRaises.length === 0 ? (
                  <p className="text-xs text-slate-400">No raised hands currently.</p>
                ) : (
                  <ul className="space-y-2">
                    {handRaises.map((h, i) => (
                      <li key={i} className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 font-medium">
                        <span>✋ {h.studentName}</span>
                        <span className="text-[10px] text-amber-700">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Connected Students Roster */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-indigo-600" />
                  <strong className="text-slate-900 text-sm">Connected Students ({roomState?.students?.length || 0})</strong>
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
                    <p className="text-xs text-slate-400">Waiting for students to join...</p>
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
          {/* Dialect Selector & Audio Preferences */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Languages size={20} className="text-indigo-600" />
              <div>
                <strong className="text-sm text-slate-900 block">Listening in Mother Tongue</strong>
                <span className="text-xs text-slate-500">Choose the regional dialect you learn in best</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={studentLanguage}
                onChange={e => handleLanguageChange(e.target.value)}
                className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {availableLanguages.map(l => (
                  <option key={l.name} value={l.name}>
                    {l.native}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={e => setAutoPlayAudio(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Auto-play speech audio
              </label>
            </div>
          </div>

          {/* Large Live Vernacular Blackboard */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-2xl p-6 lg:p-8 shadow-xl border border-indigo-900/60 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Live Mother Tongue Broadcast • {studentLanguage}
                </span>
              </div>
              <button
                type="button"
                onClick={() => playAudio(receivedAudioUrl, receivedTranslation)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <Volume2 size={15} /> Play Audio
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

            {/* Teacher's Original Hindi Speech */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
                Teacher Spoke (Hindi):
              </span>
              <p className="text-xs text-slate-300 italic">
                &ldquo;{receivedCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* Student Interaction Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ask Doubt in Mother Tongue */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={18} className="text-indigo-600" />
                <strong className="text-slate-900 text-sm">Ask Teacher a Question in {studentLanguage}</strong>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Type your doubt or question in {studentLanguage}. The platform will translate it back to Hindi for the teacher in real-time.
              </p>

              <form onSubmit={handleStudentQuestion} className="space-y-3">
                <textarea
                  value={studentQuestionText}
                  onChange={e => setStudentQuestionText(e.target.value)}
                  placeholder={`Write your question in ${studentLanguage}...`}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!studentQuestionText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                >
                  <Send size={14} /> Send Question to Teacher
                </button>
              </form>
            </div>

            {/* Raise Hand & Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hand size={18} className="text-amber-500" />
                  <strong className="text-slate-900 text-sm">Need Help?</strong>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Raise your hand to let the teacher know you have a doubt or want to speak.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRaiseHand}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isHandRaised
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                <Hand size={16} />
                {isHandRaised ? 'Hand is Raised ✓' : 'Raise My Hand ✋'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
