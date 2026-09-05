import axios from 'axios'

export type Role = 'teacher' | 'student'
export type Language = 'Hindi' | 'English' | 'Santhali' | 'Mundari' | 'Ho' | 'Kurukh'
export type Lesson = { id: number; title: string; source_text: string; source_language: string; translations?: { language: string; translated_text: string }[] }

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', timeout: 12000 })
api.interceptors.request.use(config => { const token = localStorage.getItem('vernacular-token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })

export const lessonApi = {
  list: () => api.get<Lesson[]>('/lessons').then(response => response.data),
  upload: (file: File) => { const form = new FormData(); form.append('file', file); return api.post<Lesson>('/lessons/upload', form).then(response => response.data) },
  translate: (text: string, targetLanguage: string) => api.post<{ translated_text: string }>('/translate', { text, target_language: targetLanguage }).then(response => response.data),
  translateSpeech: (text: string, targetLanguage: string) => api.post<{ translated_text: string; audio_base64: string | null; provider: string }>('/translate/speech', { text, target_language: targetLanguage }).then(response => response.data),
  transcribe: (audio: Blob) => { const form = new FormData(); form.append('file', audio, 'speech.webm'); return api.post<{ transcript: string }>('/speech/transcribe', form).then(response => response.data) },
  translateAll: (text: string) => api.post<{ source_text: string; translations: Record<string, string> }>('/translate/all', { text }).then(response => response.data),
  translateLesson: (lessonId: number, targetLanguage: string) => api.post<{ lesson_id: number; lesson_title: string; language: string; translated_text: string }>(`/lessons/${lessonId}/translations`, { target_language: targetLanguage }).then(response => response.data),
  getTranslation: (lessonId: number, targetLanguage: string) => api.get<{ lesson_id: number; lesson_title: string; language: string; translated_text: string }>(`/lessons/${lessonId}/translations/${targetLanguage}`).then(response => response.data),
}

export function createClassroomSocket(room = 'main') {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/^http/, 'ws').replace(/\/api$/, '')
  return new WebSocket(`${base}/api/classroom/${room}`)
}

export function registerServiceWorker() { if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined)) }
