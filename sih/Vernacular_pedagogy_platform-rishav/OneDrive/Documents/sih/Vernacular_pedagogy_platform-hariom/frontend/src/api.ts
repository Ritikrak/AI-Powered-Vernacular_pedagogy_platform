import axios from 'axios'
import { io, Socket } from 'socket.io-client'

export type Role = 'teacher' | 'student'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: Role
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
  title: string
  subject: string
  grade_level?: string
  gradeLevel?: string
  source_text: string
  source_language?: string
  simplified_text?: string
  simplifiedText?: string
  translations?: LessonTranslation[]
  createdAt?: string
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

export interface TranslateAllResult {
  sourceText: string
  sourceLanguage: string
  translations: Record<string, string>
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, '')

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vernacular-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Authentication API
export const authApi = {
  demoLogin: (role: Role, name?: string, email?: string) =>
    api.post<{ access_token: string; token_type: string; user: UserProfile }>('/auth/demo', {
      role,
      name,
      email
    }).then(res => res.data),

  login: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string; user: UserProfile }>('/auth/login', {
      email,
      password
    }).then(res => res.data),

  register: (data: { name: string; email: string; password: string; role: Role; preferredLanguage?: string }) =>
    api.post<{ access_token: string; token_type: string; user: UserProfile }>('/auth/register', data).then(res => res.data),

  getMe: () =>
    api.get<{ user: UserProfile }>('/auth/me').then(res => res.data)
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
    ).then(res => res.data)
}

// Translation & Audio API
export const translationApi = {
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
  getRoomDetails: (room = 'main') =>
    api.get<RoomState>(`/classroom/${room}`).then(res => res.data),

  getTranscripts: (room = 'main') =>
    api.get<{ roomCode: string; transcripts: RoomState['recentTranscripts'] }>(`/classroom/${room}/transcripts`).then(res => res.data)
}

// System Health API
export const healthApi = {
  check: () =>
    api.get<{ status: string; version: string; service: string; database: any; geminiConfigured: boolean }>('/health').then(res => res.data)
}

export const googleLoginUrl = `${API_BASE}/auth/google`

/**
 * Creates and initializes a Socket.IO connection to the backend /classroom namespace
 */
export function createClassroomSocketIO(options: {
  roomCode?: string
  role?: Role
  name?: string
  preferredLanguage?: string
}): Socket {
  const socket = io(`${BACKEND_BASE}/classroom`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  socket.on('connect', () => {
    socket.emit('join_room', {
      room: options.roomCode || 'main',
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
