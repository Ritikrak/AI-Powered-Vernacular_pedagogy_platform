import axios from 'axios'
import { io, Socket } from 'socket.io-client'

export type Role = 'teacher' | 'student'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: Role
  teacherId?: string
  preferredLanguage?: string
}

export interface VernacularLanguage {
  id: number
  language_code: string
  language_name: string
  native_name: string
  supported_scripts: string[]
  is_active: boolean
  sample_phrase?: {
    source: string
    translated: string
    phonetic: string
  }
}

export interface LessonTranslation {
  language: string
  translated_text: string
  phonetic_text?: string
  provider?: string
}

export interface Lesson {
  id: number | string
  _id?: string
  rawId?: string
  title: string
  subject: string
  class?: number
  grade_level?: string
  gradeLevel?: string
  description?: string
  availableLanguages?: string[]
  audioAvailable?: boolean
  source_text: string
  source_language?: string
  simplified_text?: string
  simplifiedText?: string
  translations?: LessonTranslation[]
  createdAt?: string
}

export interface ProgressSummary {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  records?: Array<{
    lessonId: string
    progress: number
    status: 'completed' | 'in_progress' | 'not_started'
    title?: string
  }>
}

export interface SavedLessonsResponse {
  studentId: string
  total: number
  savedLessons: string[]
}

export interface LessonAudioResponse {
  lessonId: string
  title: string
  audio: Record<string, string>
}

export interface ActiveRoom {
  id: string
  roomCode: string
  title: string
  subject: string
  teacherOnline: boolean
  teacherName: string
  studentCount: number
  isLive: boolean
}

export interface SpeechTranslationResult {
  translated_text: string
  phonetic_text?: string
  audio_url?: string
  audio_base64?: string | null
  provider: string
}

export interface SingleTranslationResult {
  translated_text: string
  phonetic_text?: string
  target_language: string
  provider: string
}

export interface CommonWordEntry {
  id: string
  category: string
  english: string
  hindi: string
  aliases: string[]
  translations: Record<string, { text: string; phonetic: string }>
}

export interface TranslateAllResult {
  sourceText: string
  sourceLanguage: string
  translations: Record<string, string>
  provider?: string
  wordId?: string
  category?: string
}

export interface RoomParticipant {
  name: string
  preferredLanguage?: string
}

export interface RoomState {
  roomCode: string
  title: string
  teacherOnline: boolean
  teacherName: string
  studentCount: number
  students: RoomParticipant[]
  recentTranscripts: Array<{
    id: string
    speaker: string
    sourceText: string
    sourceLanguage: string
    translations: Record<string, { text: string; phonetic?: string; audioUrl?: string; provider?: string }>
    timestamp: string
  }>
}

export interface StudentQuestion {
  id: string
  studentName: string
  originalLanguage: string
  originalText: string
  hindiTranslation: string
  timestamp: string
}

export const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000')
export const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vernacular-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface LoginResponse {
  success?: boolean
  requireOtp?: boolean
  role?: Role
  email?: string
  teacherId?: string
  teacherName?: string
  message?: string
  devOtp?: string
  access_token?: string
  token?: string
  token_type?: string
  user?: UserProfile
}

export interface VerifyOtpResponse {
  success: boolean
  message: string
  access_token: string
  token: string
  token_type: string
  role: Role
  user: UserProfile
}

// Authentication API
export const authApi = {
  demoLogin: (role: Role, name?: string, email?: string) =>
    api.post<{ access_token: string; token_type: string; user: UserProfile }>('/auth/demo', {
      role,
      name,
      email
    }).then(res => res.data),

  login: (identifier: string, password: string, role?: Role, remember = false) =>
    api.post<LoginResponse>('/auth/login', {
      identifier,
      email: identifier,
      password,
      role,
      remember
    }).then(res => res.data),

  verifyOtp: (email: string, otp: string, remember = false) =>
    api.post<VerifyOtpResponse>('/auth/verify-otp', {
      email,
      otp,
      remember
    }).then(res => res.data),

  resendOtp: (email: string) =>
    api.post<{ success: boolean; message: string; devOtp?: string }>('/auth/resend-otp', {
      email
    }).then(res => res.data),

  register: (data: { name: string; email: string; password: string; role: Role; preferredLanguage?: string }) =>
    api.post<{ access_token: string; token_type: string; user: UserProfile }>('/auth/register', data).then(res => res.data),

  getMe: () =>
    api.get<{ user: UserProfile }>('/auth/me').then(res => res.data),

  logout: () =>
    api.post<{ success: boolean; message: string }>('/auth/logout').then(res => res.data)
}

// Languages Catalog API
export const languagesApi = {
  list: () =>
    api.get<VernacularLanguage[]>('/languages').then(res => res.data)
}

// Lessons Management API
export const lessonApi = {
  list: () =>
    api.get<Lesson[]>('/lessons').then(res => res.data),

  getById: (id: string | number) =>
    api.get<Lesson>(`/lessons/${id}`).then(res => res.data),

  upload: (formData: FormData) =>
    api.post<Lesson>('/lessons/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),

  createManual: (data: { title: string; subject: string; gradeLevel: string; sourceText: string }) =>
    api.post<Lesson>('/lessons/upload', data).then(res => res.data),

  simplify: (text: string, gradeLevel = 'Class 5', language = 'Hindi') =>
    api.post<{ original_text: string; grade_level: string; simplified_text: string }>('/lessons/simplify', {
      text,
      gradeLevel,
      language
    }).then(res => res.data),

  translateLesson: (lessonId: string | number, targetLanguage: string) =>
    api.post<{ lesson_id: string | number; lesson_title: string; language: string; translated_text: string; phonetic_text?: string; provider: string }>(
      `/lessons/${lessonId}/translations`,
      { target_language: targetLanguage }
    ).then(res => res.data),

  getTranslation: (lessonId: string | number, targetLanguage: string) =>
    api.get<{ lesson_id: string | number; lesson_title: string; language: string; translated_text: string }>(
      `/lessons/${lessonId}/translations/${targetLanguage}`
    ).then(res => res.data),

  complete: (id: string | number) =>
    api.post<{ success: boolean; lessonId: string; status: string; summary: ProgressSummary }>(`/lessons/${id}/complete`).then(res => res.data),

  getAudio: (id: string | number) =>
    api.get<LessonAudioResponse>(`/lessons/${id}/audio`).then(res => res.data)
}

// Progress Tracking API
export const progressApi = {
  record: (lessonId: string | number, progress: number) =>
    api.post<{ success: boolean; record: any; summary: ProgressSummary }>('/progress', {
      lessonId,
      progress
    }).then(res => res.data),

  getSummary: () =>
    api.get<ProgressSummary>('/progress').then(res => res.data)
}

// Student Preferences & Saved Lessons (Offline Study) API
export interface LanguageItem {
  code: string
  name: string
  script?: string
  native?: string
  language_code?: string
  language_name?: string
}

export interface StudentPreferences {
  studentId: string
  language: string
  languageName?: string
  autoPlay: boolean
}

export interface ClassroomHistoryMessage {
  id: string
  timestamp: string
  isoTime?: string
  teacherText: string
  sourceText?: string
  sourceLanguage: string
  translations: Record<string, { text: string; phonetic?: string; audioUrl?: string; provider?: string }>
}

export interface ClassroomMessagesResponse {
  roomId: string
  roomCode: string
  total: number
  messages: ClassroomHistoryMessage[]
}

export const languageApi = {
  getLanguages: () =>
    api.get<LanguageItem[]>('/languages').then(res => res.data)
}

export const studentApi = {
  getSaved: () =>
    api.get<SavedLessonsResponse>('/student/saved-lessons').then(res => res.data),

  save: (lessonId: string | number, lessonTitle?: string) =>
    api.post<{ success: boolean; totalSaved: number; savedLessons: string[] }>('/student/saved-lessons', {
      lessonId,
      lessonTitle
    }).then(res => res.data),

  removeSaved: (lessonId: string | number) =>
    api.delete<{ success: boolean; totalSaved: number; savedLessons: string[] }>(`/student/saved-lessons/${lessonId}`).then(res => res.data),

  getPreferences: () =>
    api.get<StudentPreferences>('/students/preferences').then(res => res.data),

  updateLanguage: (language: string) =>
    api.put<StudentPreferences>('/students/language', { language }).then(res => res.data),

  updatePreferences: (prefs: Partial<StudentPreferences>) =>
    api.put<StudentPreferences>('/students/preferences', prefs).then(res => res.data)
}

// Translation & Audio API
export const translationApi = {
  getCommonWords: () =>
    api.get<{ total: number; languages: string[]; words: CommonWordEntry[] }>('/translate/common-words').then(res => res.data),

  translateSingle: (text: string, targetLanguage: string, sourceLanguage = 'Hindi') =>
    api.post<SingleTranslationResult>('/translate', {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage
    }).then(res => res.data),

  translateAll: (text: string, sourceLanguage = 'Hindi') =>
    api.post<TranslateAllResult>('/translate/all', {
      text,
      source_language: sourceLanguage
    }).then(res => res.data),

  translateSpeech: (text: string, targetLanguage: string, sourceLanguage = 'Hindi') =>
    api.post<SpeechTranslationResult>('/translate/speech', {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage
    }).then(res => res.data),

  transcribeAudio: (audioBlob: Blob) => {
    const form = new FormData()
    form.append('file', audioBlob, 'audio.webm')
    return api.post<{ transcript: string; confidence?: number; provider: string }>('/speech/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  }
}

// Classroom REST API
export const classroomApi = {
  getActiveRooms: () =>
    api.get<{ total: number; rooms: ActiveRoom[] }>('/classrooms/active').then(res => res.data),

  createRoom: (data: { roomCode?: string; name?: string; title?: string; currentLesson?: string; currentLanguage?: string }) =>
    api.post<{ success: boolean; message: string; room: any }>('/classrooms', data).then(res => res.data),

  startClassroom: (roomCode = 'MAIN') =>
    api.post<{ success: boolean; message: string; room: any }>(`/classrooms/${roomCode}/start`).then(res => res.data),

  endClassroom: (roomCode = 'MAIN') =>
    api.post<{ success: boolean; message: string; room: any }>(`/classrooms/${roomCode}/end`).then(res => res.data),

  broadcast: (
    roomCode: string,
    textOrPayload: string | { text?: string; speechText?: string; language?: string; sourceLanguage?: string },
    language = 'Hindi'
  ) => {
    const text = typeof textOrPayload === 'string'
      ? textOrPayload
      : textOrPayload.speechText || textOrPayload.text || ''
    const lang = typeof textOrPayload === 'object'
      ? textOrPayload.language || textOrPayload.sourceLanguage || language
      : language

    return api.post<{ success: boolean; broadcast: any }>(`/classrooms/${roomCode}/broadcast`, {
      text,
      speechText: text,
      language: lang,
      sourceLanguage: lang
    }).then(res => res.data)
  },

  joinRoom: (roomCode = 'MAIN', data?: any) =>
    api.post<{ success: boolean; roomCode: string; name: string; active: boolean; studentCount: number }>(`/classrooms/${roomCode}/join`, data).then(res => res.data),

  leaveRoom: (roomCode = 'MAIN') =>
    api.post<{ success: boolean; message: string }>(`/classrooms/${roomCode}/leave`).then(res => res.data),

  getRoomDetails: (room = 'main') =>
    api.get<RoomState>(`/classrooms/${room}`).then(res => res.data),

  getTranscripts: (room = 'main') =>
    api.get<{ roomCode: string; transcripts: RoomState['recentTranscripts'] }>(`/classrooms/${room}/transcripts`).then(res => res.data),

  getMessages: (room = 'main') =>
    api.get<ClassroomMessagesResponse>(`/classrooms/${room}/messages`).then(res => res.data),

  askQuestion: (room: string, data: { studentName?: string; text: string; language?: string }) =>
    api.post<{ success: boolean; question: any }>(`/classrooms/${room}/questions`, data).then(res => res.data),

  answerQuestion: (room: string, data: { questionId: string; text: string }) =>
    api.post<{ success: boolean; answer: any }>(`/classrooms/${room}/answers`, data).then(res => res.data)
}

// Speech Generation API
export const speechApi = {
  generate: (text: string, language = 'Hindi', phonetic = '') =>
    api.post<{ success: boolean; audioUrl: string; text: string; phonetic?: string; language: string }>('/speech/generate', { text, language, phonetic }).then(res => res.data),

  getStreamUrl: (text: string, language = 'Hindi', phonetic = '') => {
    const params = new URLSearchParams({
      text: text || '',
      language: language || 'Hindi',
      phonetic: phonetic || ''
    })
    return `${API_BASE}/speech/audio-stream?${params.toString()}`
  },

  resolveAudioUrl: (url?: string | null): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${BACKEND_BASE}${url.startsWith('/') ? '' : '/'}${url}`
  }
}

let globalAudioPlayer: HTMLAudioElement | null = null

export function playVernacularAudio(options: {
  text?: string
  language?: string
  phonetic?: string
  audioUrl?: string | null
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: any) => void
}) {
  const { text = '', language = 'Hindi', phonetic = '', audioUrl, onStart, onEnd, onError } = options

  if (globalAudioPlayer) {
    try {
      globalAudioPlayer.pause()
      globalAudioPlayer.currentTime = 0
    } catch {}
  }

  // 1. Resolve Stream URL
  let resolvedUrl = ''
  if (audioUrl) {
    resolvedUrl = speechApi.resolveAudioUrl(audioUrl)
  } else {
    resolvedUrl = speechApi.getStreamUrl(text, language, phonetic)
  }

  onStart?.()

  const player = new Audio(resolvedUrl)
  globalAudioPlayer = player

  player.onended = () => {
    onEnd?.()
  }

  const doBrowserFallback = () => {
    const toSpeak = (phonetic && phonetic.trim()) ? phonetic.trim() : text
    if ('speechSynthesis' in window && toSpeak) {
      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(toSpeak)
        utterance.rate = 0.92
        const voices = window.speechSynthesis.getVoices()
        const isEnglish = (language || '').toLowerCase() === 'english'
        const matchedVoice = voices.find(v =>
          isEnglish
            ? (v.lang.includes('en') || v.lang.includes('IN'))
            : (v.lang.includes('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('india'))
        )
        if (matchedVoice) utterance.voice = matchedVoice

        utterance.onend = () => onEnd?.()
        utterance.onerror = (e) => {
          onError?.(e)
          onEnd?.()
        }
        window.speechSynthesis.speak(utterance)
        return
      } catch (err) {
        onError?.(err)
      }
    }
    onEnd?.()
  }

  player.onerror = () => {
    console.warn('Audio stream failed, using browser speech synthesis fallback')
    doBrowserFallback()
  }

  player.play().catch(err => {
    console.warn('Direct audio playback failed, falling back to speech synthesis:', err)
    doBrowserFallback()
  })
}

// System Health API
export const healthApi = {
  check: () =>
    api.get<{ status: string; version: string; service: string; database: any; geminiConfigured: boolean }>('/health').then(res => res.data)
}

/**
 * Creates and initializes an Authenticated Socket.IO connection to the backend /classroom namespace
 */
export function createClassroomSocketIO(options: {
  roomCode?: string
  role?: Role
  name?: string
  preferredLanguage?: string
  token?: string
}): Socket {
  const token = options.token || localStorage.getItem('vernacular-token') || ''
  const socket = io(`${BACKEND_BASE}/classroom`, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
      role: options.role || 'student',
      name: options.name,
      preferredLanguage: options.preferredLanguage
    },
    query: {
      token
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  })

  socket.on('connect', () => {
    socket.emit('join_room', {
      room: (options.roomCode || 'MAIN').toUpperCase(),
      role: options.role || 'student',
      name: options.name || (options.role === 'teacher' ? 'Classroom Teacher' : 'Student'),
      preferredLanguage: options.preferredLanguage || 'Santhali'
    })
  })

  return socket
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    })
  }
}

/**
 * 1. Capture and Stream Audio: Frontend
 * Uses MediaRecorder API to capture microphone input as audio/webm;codecs=opus
 * and streams binary chunks over WebSocket to /api/classroom/{room_id}/deepgram
 */
export class DeepgramLiveAudioStreamer {
  private mediaRecorder: MediaRecorder | null = null
  private socket: WebSocket | null = null
  private stream: MediaStream | null = null
  public isRecording = false
  private roomId: string
  private sourceLanguage: string
  private onTranscript?: (data: { transcript: string; isFinal: boolean; translations?: Record<string, any> }) => void
  private onError?: (err: any) => void

  constructor(options: {
    roomId: string
    sourceLanguage?: string
    onTranscript?: (data: { transcript: string; isFinal: boolean; translations?: Record<string, any> }) => void
    onError?: (err: any) => void
  }) {
    this.roomId = options.roomId || 'MAIN'
    this.sourceLanguage = options.sourceLanguage || 'Hindi'
    this.onTranscript = options.onTranscript
    this.onError = options.onError
  }

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.stream = stream

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const rawHost = BACKEND_BASE || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000')
      const wsHost = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const langParam = encodeURIComponent(this.sourceLanguage)
      const wsUrl = `${wsProtocol}//${wsHost}/api/classroom/${encodeURIComponent(this.roomId)}/deepgram?role=teacher&language=${langParam}`

      const socket = new WebSocket(wsUrl)
      socket.binaryType = 'arraybuffer'
      this.socket = socket

      socket.onopen = () => {
        console.log(`[DeepgramLiveAudioStreamer] Connected to ${wsUrl}`)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'

        const recorder = new MediaRecorder(stream, { mimeType })
        this.mediaRecorder = recorder

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            // Binary audio chunks actively sent over WebSocket
            socket.send(event.data)
          }
        }

        // Send chunks every 250ms for low-latency sub-3s transcription & translation
        recorder.start(250)
        this.isRecording = true
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (this.onTranscript) {
            this.onTranscript(payload)
          }
        } catch {
          // ignore non-json
        }
      }

      socket.onerror = (err) => {
        console.warn('[DeepgramLiveAudioStreamer] WebSocket error:', err)
        if (this.onError) this.onError(err)
      }

      socket.onclose = () => {
        console.log('[DeepgramLiveAudioStreamer] WebSocket closed')
        this.isRecording = false
      }
    } catch (err: any) {
      this.isRecording = false
      if (this.onError) this.onError(err)
      throw err
    }
  }

  stop(): void {
    this.isRecording = false
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {}
    }
    if (this.stream) {
      try {
        this.stream.getTracks().forEach(t => t.stop())
      } catch {}
    }
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      try {
        this.socket.close()
      } catch {}
    }
    this.mediaRecorder = null
    this.stream = null
    this.socket = null
  }
}

