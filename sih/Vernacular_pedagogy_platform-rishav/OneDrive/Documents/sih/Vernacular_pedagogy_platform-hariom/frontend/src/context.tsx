import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, authApi, languagesApi, type Role, type UserProfile, type VernacularLanguage } from './api'

export type ToastTone = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; tone: ToastTone }

export interface StudentItem {
  id: string
  name: string
  preferredLanguage: string
  gradeLevel: string
  section: string
  rollNumber?: string
  score?: number
  attendanceStatus?: 'active' | 'idle' | 'offline'
}

export interface LessonItem {
  id: string
  title: string
  subject: string
  gradeLevel: string
  source_text: string
  simplified_text: string
  status?: 'published' | 'draft'
  createdAt?: string
}

export interface DialectItem {
  id: string
  name: string
  englishName: string
  script: string
  nativeScriptSample: string
  speakersEstimate: string
  region: string
  isDefault?: boolean
}

export interface ActivityItem {
  id: string
  type: 'student' | 'lesson' | 'dialect' | 'classroom' | 'translation'
  title: string
  detail: string
  timeAgo: string
  dot: string
}

interface AppContextValue {
  role: Role | null
  userName: string
  userEmail: string
  preferredLanguage: string
  teacherSourceLanguage: string
  token: string | null
  languages: VernacularLanguage[]
  activeRoom: string
  toasts: Toast[]
  
  // Dynamic Entities
  students: StudentItem[]
  lessons: LessonItem[]
  dialects: DialectItem[]
  activities: ActivityItem[]
  comprehensionGain: number
  
  // Student Actions
  addStudent: (student: Omit<StudentItem, 'id'>) => StudentItem
  deleteStudent: (id: string) => void
  updateStudent: (id: string, updates: Partial<StudentItem>) => void
  
  // Lesson Actions
  createLesson: (lesson: Omit<LessonItem, 'id'>) => LessonItem
  deleteLesson: (id: string) => void
  updateLesson: (id: string, updates: Partial<LessonItem>) => void
  
  // Dialect Actions
  addDialect: (dialect: Omit<DialectItem, 'id'>) => DialectItem
  deleteDialect: (id: string) => void
  
  // Activity Action
  addActivity: (type: ActivityItem['type'], title: string, detail: string) => void

  // Platform Actions
  signIn: (role: Role, name: string, email?: string) => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; role: Role }>
  completeSessionLogin: (token: string, user: UserProfile, remember?: boolean) => void
  register: (data: { name: string; email: string; password: string; role: Role; preferredLanguage?: string }) => Promise<{ success: boolean; role: Role }>
  signOut: () => void
  setPreferredLanguage: (language: string) => void
  setTeacherSourceLanguage: (language: string) => void
  setActiveRoom: (room: string) => void
  toast: (message: string, tone?: ToastTone) => void
  updateProfile: (name: string, email?: string, language?: string) => void
  refreshLanguages: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

import { CURRICULUM_STORIES } from './curriculumStories'

const defaultStudents: StudentItem[] = [
  { id: 'std-1', name: 'Aman Raj', preferredLanguage: 'Santhali', gradeLevel: 'Class 5', section: 'A', rollNumber: '01', score: 94, attendanceStatus: 'active' },
  { id: 'std-2', name: 'Sita Marandi', preferredLanguage: 'Santhali', gradeLevel: 'Class 5', section: 'A', rollNumber: '02', score: 96, attendanceStatus: 'active' },
  { id: 'std-3', name: 'Birsa Munda', preferredLanguage: 'Mundari', gradeLevel: 'Class 5', section: 'B', rollNumber: '03', score: 92, attendanceStatus: 'active' },
  { id: 'std-4', name: 'Rani Hembrom', preferredLanguage: 'Ho', gradeLevel: 'Class 5', section: 'A', rollNumber: '04', score: 95, attendanceStatus: 'active' },
  { id: 'std-5', name: 'Karan Oraon', preferredLanguage: 'Kurukh', gradeLevel: 'Class 5', section: 'C', rollNumber: '05', score: 91, attendanceStatus: 'active' },
  { id: 'std-6', name: 'Anita Soren', preferredLanguage: 'Santhali', gradeLevel: 'Class 5', section: 'A', rollNumber: '06', score: 98, attendanceStatus: 'active' },
  { id: 'std-7', name: 'Sanjay Lugun', preferredLanguage: 'Mundari', gradeLevel: 'Class 5', section: 'B', rollNumber: '07', score: 92, attendanceStatus: 'active' }
]

const defaultLessons: LessonItem[] = CURRICULUM_STORIES.map(item => ({
  id: String(item.id || item._id),
  title: item.title,
  subject: item.subject,
  gradeLevel: item.grade_level || item.gradeLevel || 'Class 5',
  source_text: item.source_text,
  simplified_text: item.simplified_text || '',
  status: 'published',
  createdAt: '2026-09-01'
}))

const defaultDialects: DialectItem[] = [
  { id: 'sat', name: 'संथाली', englishName: 'Santhali', script: 'Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)', nativeScriptSample: 'ᱥᱟᱱᱛᱟᱲᱤ', speakersEstimate: '7.6M speakers', region: 'Santhal Pargana, Dumka', isDefault: true },
  { id: 'unr', name: 'मुंडारी', englishName: 'Mundari', script: 'Mundari Bani (ᱢᱩᱱᱰᱟᱨᱤ)', nativeScriptSample: 'ᱢᱩᱱᱰᱟᱨᱤ', speakersEstimate: '1.2M speakers', region: 'Khunti, Ranchi', isDefault: true },
  { id: 'hoc', name: 'हो', englishName: 'Ho', script: 'Warang Citi (ᱣᱟᱨᱟᱝ ᱪᱤᱛᱤ)', nativeScriptSample: 'ᱦᱳ', speakersEstimate: '1.4M speakers', region: 'West Singhbhum, Chaibasa', isDefault: true },
  { id: 'kru', name: 'कुड़ुख़', englishName: 'Kurukh', script: 'Tolong Siki (ᱛᱚᱞᱚᱝ ᱥᱤᱠᱤ)', nativeScriptSample: 'ᱠᱩᱲᱩᱠᱷ', speakersEstimate: '2.0M speakers', region: 'Gumla, Lohardaga', isDefault: true }
]

const defaultActivities: ActivityItem[] = [
  { id: 'act-1', type: 'classroom', title: 'Real-time Socket.IO Engine', detail: 'Classroom Room 01 is operational with vernacular matrix', timeAgo: 'Now', dot: '✓' },
  { id: 'act-2', type: 'dialect', title: 'AI Vernacular Engine', detail: 'Santhali (Ol Chiki) & Mundari Bani enabled', timeAgo: 'Today', dot: '✓' },
  { id: 'act-3', type: 'lesson', title: 'Curriculum Stories Synced', detail: '17 short stories & lessons available in vernacular catalog', timeAgo: 'Recent', dot: '✓' }
]

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => localStorage.getItem('vernacular-role') as Role | null)
  const [userName, setUserName] = useState(() => localStorage.getItem('vernacular-name') || '')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('vernacular-email') || '')
  const [preferredLanguage, setPreferredLangState] = useState(() => localStorage.getItem('vernacular-language') || 'Santhali')
  const [teacherSourceLanguage, setTeacherSourceLanguageState] = useState(() => localStorage.getItem('vernacular-teacher-source-language') || 'Hindi')
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vernacular-token'))
  const [activeRoom, setActiveRoom] = useState('main')
  const [languages, setLanguages] = useState<VernacularLanguage[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  // Dynamic entities persisted to localStorage
  const [students, setStudents] = useState<StudentItem[]>(() => {
    try {
      const saved = localStorage.getItem('vernacular-students')
      return saved ? JSON.parse(saved) : defaultStudents
    } catch {
      return defaultStudents
    }
  })

  const [lessons, setLessons] = useState<LessonItem[]>(() => {
    try {
      const saved = localStorage.getItem('vernacular-lessons')
      if (saved) {
        const parsed = JSON.parse(saved) as LessonItem[]
        // Ensure all 17 curriculum stories are populated while preserving custom additions
        const existingIds = new Set(parsed.map(p => p.id))
        const missingStories = defaultLessons.filter(dl => !existingIds.has(dl.id))
        if (missingStories.length > 0) {
          const merged = [...parsed, ...missingStories]
          localStorage.setItem('vernacular-lessons', JSON.stringify(merged))
          return merged
        }
        return parsed
      }
      return defaultLessons
    } catch {
      return defaultLessons
    }
  })

  const [dialects, setDialects] = useState<DialectItem[]>(() => {
    try {
      const saved = localStorage.getItem('vernacular-dialects')
      return saved ? JSON.parse(saved) : defaultDialects
    } catch {
      return defaultDialects
    }
  })

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('vernacular-activities')
      return saved ? JSON.parse(saved) : defaultActivities
    } catch {
      return defaultActivities
    }
  })

  // Dynamic Comprehension Gain calculation based on student assessments
  const comprehensionGain = useMemo(() => {
    if (students.length === 0) return 94
    const sum = students.reduce((acc, s) => acc + (s.score || 94), 0)
    return Math.min(99, Math.max(75, Math.round(sum / students.length)))
  }, [students])

  const toast = (message: string, tone: ToastTone = 'info') => {
    const id = Date.now()
    setToasts(current => [...current, { id, message, tone }])
    window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 3800)
  }

  const addActivity = (type: ActivityItem['type'], title: string, detail: string) => {
    const newAct: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      detail,
      timeAgo: 'Just now',
      dot: '✓'
    }
    setActivities(prev => {
      const updated = [newAct, ...prev.slice(0, 19)]
      try {
        localStorage.setItem('vernacular-activities', JSON.stringify(updated))
      } catch (err) {
        console.warn('Could not save activity:', err)
      }
      return updated
    })
  }

  // Student CRUD Operations
  const addStudent = (studentData: Omit<StudentItem, 'id'>): StudentItem => {
    const newStudent: StudentItem = {
      ...studentData,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      score: studentData.score || Math.floor(Math.random() * 8 + 91),
      attendanceStatus: studentData.attendanceStatus || 'active'
    }
    setStudents(prev => {
      const updated = [newStudent, ...prev]
      try {
        localStorage.setItem('vernacular-students', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    addActivity('student', 'Student Enrolled', `${newStudent.name} joined ${newStudent.gradeLevel || 'Class 5'} (${newStudent.preferredLanguage})`)
    toast(`Student "${newStudent.name}" enrolled! Connected count updated.`, 'success')
    return newStudent
  }

  const deleteStudent = (id: string) => {
    const target = students.find(s => s.id === id)
    const name = target ? target.name : 'Student'
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id)
      try {
        localStorage.setItem('vernacular-students', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    addActivity('student', 'Student Removed', `${name} removed from classroom roster`)
    toast(`Student "${name}" removed. Connected count updated.`, 'info')
  }

  const updateStudent = (id: string, updates: Partial<StudentItem>) => {
    setStudents(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, ...updates } : s))
      try {
        localStorage.setItem('vernacular-students', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    toast('Student profile updated', 'success')
  }

  // Lesson CRUD Operations
  const createLesson = (lessonData: Omit<LessonItem, 'id'>): LessonItem => {
    const newLesson: LessonItem = {
      ...lessonData,
      id: `les-${Date.now()}`,
      status: lessonData.status || 'published',
      createdAt: new Date().toISOString().split('T')[0]
    }
    setLessons(prev => {
      const updated = [newLesson, ...prev]
      try {
        localStorage.setItem('vernacular-lessons', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    addActivity('lesson', 'Curriculum Lesson Created', `"${newLesson.title}" (${newLesson.subject}) added to repository`)
    toast(`Lesson "${newLesson.title}" created! Lesson count updated.`, 'success')
    return newLesson
  }

  const deleteLesson = (id: string) => {
    const target = lessons.find(l => l.id === id)
    const title = target ? target.title : 'Lesson'
    setLessons(prev => {
      const updated = prev.filter(l => l.id !== id)
      try {
        localStorage.setItem('vernacular-lessons', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    addActivity('lesson', 'Lesson Removed', `"${title}" deleted from catalog`)
    toast(`Lesson "${title}" deleted. Curriculum count updated.`, 'info')
  }

  const updateLesson = (id: string, updates: Partial<LessonItem>) => {
    setLessons(prev => {
      const updated = prev.map(l => (l.id === id ? { ...l, ...updates } : l))
      try {
        localStorage.setItem('vernacular-lessons', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    toast('Lesson updated', 'success')
  }

  // Dialect Operations
  const addDialect = (dialectData: Omit<DialectItem, 'id'>): DialectItem => {
    const newDialect: DialectItem = {
      ...dialectData,
      id: `dl-${Date.now()}`
    }
    setDialects(prev => {
      const updated = [...prev, newDialect]
      try {
        localStorage.setItem('vernacular-dialects', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    addActivity('dialect', 'Vernacular Dialect Added', `${newDialect.englishName} (${newDialect.script}) enabled`)
    toast(`Dialect "${newDialect.englishName}" added! Dialects count updated.`, 'success')
    return newDialect
  }

  const deleteDialect = (id: string) => {
    const target = dialects.find(d => d.id === id)
    const name = target ? target.englishName : 'Dialect'
    setDialects(prev => {
      const updated = prev.filter(d => d.id !== id)
      try {
        localStorage.setItem('vernacular-dialects', JSON.stringify(updated))
      } catch (err) {
        console.warn(err)
      }
      return updated
    })
    addActivity('dialect', 'Dialect Removed', `${name} disabled from active platform languages`)
    toast(`Dialect "${name}" removed. Dialects count updated.`, 'info')
  }

  const updateProfile = (name: string, email?: string, language?: string) => {
    setUserName(name)
    localStorage.setItem('vernacular-name', name)
    if (email) {
      setUserEmail(email)
      localStorage.setItem('vernacular-email', email)
    }
    if (language) {
      setPreferredLanguage(language)
    }
    addActivity('classroom', 'Profile Updated', `${name}'s platform preferences saved`)
    toast('Profile & settings updated successfully!', 'success')
  }

  const refreshLanguages = async () => {
    try {
      const data = await languagesApi.list()
      if (Array.isArray(data) && data.length > 0) {
        setLanguages(data)
      }
    } catch {
      setLanguages([
        { id: 1, language_code: 'sat', language_name: 'Santhali', native_name: 'संथाली / ᱥᱟᱱᱛᱟᱲᱤ', supported_scripts: ['Ol Chiki'], is_active: true },
        { id: 2, language_code: 'unr', language_name: 'Mundari', native_name: 'मुंडारी / ᱢᱩᱱᱰᱟᱨᱤ', supported_scripts: ['Mundari Bani'], is_active: true },
        { id: 3, language_code: 'hoc', language_name: 'Ho', native_name: 'हो / ᱦᱳ', supported_scripts: ['Warang Citi'], is_active: true },
        { id: 4, language_code: 'kru', language_name: 'Kurukh', native_name: 'कुड़ुख़ / ᱠᱩᱲᱩᱠᱷ', supported_scripts: ['Tolong Siki'], is_active: true },
        { id: 5, language_code: 'hi', language_name: 'Hindi', native_name: 'हिंदी', supported_scripts: ['Devanagari'], is_active: true },
        { id: 6, language_code: 'en', language_name: 'English', native_name: 'English', supported_scripts: ['Latin'], is_active: true }
      ])
    }
  }

  const refreshUserProfile = async () => {
    const savedToken = localStorage.getItem('vernacular-token')
    if (!savedToken) return

    try {
      const res = await authApi.getMe()
      if (res.user) {
        if (res.user.name) {
          setUserName(res.user.name)
          localStorage.setItem('vernacular-name', res.user.name)
        }
        if (res.user.email) {
          setUserEmail(res.user.email)
          localStorage.setItem('vernacular-email', res.user.email)
        }
        if (res.user.role) {
          setRole(res.user.role)
          localStorage.setItem('vernacular-role', res.user.role)
        }
        if (res.user.preferredLanguage) {
          setPreferredLanguage(res.user.preferredLanguage)
        }
      }
    } catch (err) {
      console.warn('Could not refresh profile from /api/auth/me:', err)
    }
  }

  useEffect(() => {
    refreshLanguages()
    refreshUserProfile()
  }, [])

  const signIn = async (nextRole: Role, name: string, email = '') => {
    const resolvedEmail = email.trim() || `${nextRole}@lokshiksha.in`
    const resolvedName = name.trim() || (resolvedEmail ? resolvedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : (nextRole === 'teacher' ? 'Classroom Teacher' : 'Student'))

    try {
      const response = await authApi.demoLogin(nextRole, resolvedName, resolvedEmail)
      localStorage.setItem('vernacular-token', response.access_token)
      setToken(response.access_token)

      const finalName = response.user?.name || resolvedName
      const finalEmail = response.user?.email || resolvedEmail
      const finalRole = response.user?.role || nextRole

      setUserName(finalName)
      setUserEmail(finalEmail)
      setRole(finalRole)

      localStorage.setItem('vernacular-role', finalRole)
      localStorage.setItem('vernacular-name', finalName)
      localStorage.setItem('vernacular-email', finalEmail)

      if (response.user?.preferredLanguage) {
        setPreferredLanguage(response.user.preferredLanguage)
      }

      toast(`Welcome, ${finalName}! (${finalRole === 'teacher' ? 'Teacher' : 'Student'})`, 'success')
    } catch (err: any) {
      console.warn('Backend login fallback:', err)
      setUserName(resolvedName)
      setUserEmail(resolvedEmail)
      setRole(nextRole)
      localStorage.setItem('vernacular-role', nextRole)
      localStorage.setItem('vernacular-name', resolvedName)
      localStorage.setItem('vernacular-email', resolvedEmail)
      toast(`Signed in as ${resolvedName}`, 'info')
    }
  }

  const setPreferredLanguage = (language: string) => {
    setPreferredLangState(language)
    localStorage.setItem('vernacular-language', language)
  }

  const setTeacherSourceLanguage = (language: string) => {
    setTeacherSourceLanguageState(language)
    localStorage.setItem('vernacular-teacher-source-language', language)
    addActivity('classroom', 'Teaching Language Changed', `Teaching source language set to ${language}`)
    toast(`Teaching source language switched to ${language}`, 'success')
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; role: Role }> => {
    try {
      const response = await authApi.login(email, password)
      const accessToken = response.access_token || response.token || ''
      if (accessToken) {
        localStorage.setItem('vernacular-token', accessToken)
        setToken(accessToken)
      }

      const user = response.user
      const finalRole = (user?.role || 'student') as Role
      const finalName = user?.name || email.split('@')[0]
      const finalEmail = user?.email || email

      setUserName(finalName)
      setUserEmail(finalEmail)
      setRole(finalRole)

      localStorage.setItem('vernacular-role', finalRole)
      localStorage.setItem('vernacular-name', finalName)
      localStorage.setItem('vernacular-email', finalEmail)

      if (user?.preferredLanguage) {
        setPreferredLanguage(user.preferredLanguage)
      }

      toast(`Welcome back, ${finalName}! (${finalRole === 'teacher' ? 'Teacher' : 'Student'})`, 'success')
      return { success: true, role: finalRole }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed'
      toast(msg, 'error')
      throw new Error(msg)
    }
  }

  const register = async (data: { name: string; email: string; password: string; role: Role; preferredLanguage?: string }): Promise<{ success: boolean; role: Role }> => {
    try {
      const response = await authApi.register(data)
      const accessToken = response.access_token
      localStorage.setItem('vernacular-token', accessToken)
      setToken(accessToken)

      const user = response.user
      const finalRole = (user?.role || data.role) as Role
      const finalName = user?.name || data.name
      const finalEmail = user?.email || data.email

      setUserName(finalName)
      setUserEmail(finalEmail)
      setRole(finalRole)

      localStorage.setItem('vernacular-role', finalRole)
      localStorage.setItem('vernacular-name', finalName)
      localStorage.setItem('vernacular-email', finalEmail)

      if (user?.preferredLanguage || data.preferredLanguage) {
        setPreferredLanguage(user?.preferredLanguage || data.preferredLanguage || 'Santhali')
      }

      toast(`Account created! Welcome, ${finalName} (${finalRole === 'teacher' ? 'Teacher' : 'Student'})`, 'success')
      return { success: true, role: finalRole }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed'
      toast(msg, 'error')
      throw new Error(msg)
    }
  }

  const completeSessionLogin = (accessToken: string, user: UserProfile, remember = true) => {
    localStorage.setItem('vernacular-token', accessToken)
    setToken(accessToken)

    const finalRole = (user?.role || 'student') as Role
    const finalName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
    const finalEmail = user?.email || ''

    setUserName(finalName)
    setUserEmail(finalEmail)
    setRole(finalRole)

    if (remember) {
      localStorage.setItem('vernacular-role', finalRole)
      localStorage.setItem('vernacular-name', finalName)
      localStorage.setItem('vernacular-email', finalEmail)
    } else {
      sessionStorage.setItem('vernacular-role', finalRole)
      sessionStorage.setItem('vernacular-name', finalName)
      sessionStorage.setItem('vernacular-email', finalEmail)
      localStorage.removeItem('vernacular-role')
      localStorage.removeItem('vernacular-name')
      localStorage.removeItem('vernacular-email')
    }

    if (user?.preferredLanguage) {
      setPreferredLanguage(user.preferredLanguage)
    }

    toast(`Welcome, ${finalName}! (${finalRole === 'teacher' ? 'Teacher' : 'Student'})`, 'success')
  }

  const signOut = () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('vernacular-role')
    localStorage.removeItem('vernacular-name')
    localStorage.removeItem('vernacular-email')
    localStorage.removeItem('vernacular-token')
    sessionStorage.removeItem('vernacular-role')
    sessionStorage.removeItem('vernacular-name')
    sessionStorage.removeItem('vernacular-email')
    setRole(null)
    setUserName('')
    setUserEmail('')
    setToken(null)
    toast('You have been signed out', 'info')
  }

  const value = useMemo(
    () => ({
      role,
      userName,
      userEmail,
      preferredLanguage,
      token,
      languages,
      activeRoom,
      toasts,
      students,
      lessons,
      dialects,
      activities,
      comprehensionGain,
      addStudent,
      deleteStudent,
      updateStudent,
      createLesson,
      deleteLesson,
      updateLesson,
      addDialect,
      deleteDialect,
      addActivity,
      signIn,
      login,
      completeSessionLogin,
      register,
      signOut,
      setPreferredLanguage,
      teacherSourceLanguage,
      setTeacherSourceLanguage,
      setActiveRoom,
      toast,
      updateProfile,
      refreshLanguages,
      refreshUserProfile
    }),
    [
      role,
      userName,
      userEmail,
      preferredLanguage,
      teacherSourceLanguage,
      token,
      languages,
      activeRoom,
      toasts,
      students,
      lessons,
      dialects,
      activities,
      comprehensionGain
    ]
  )

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(item => (
          <div className={`toast ${item.tone}`} key={item.id}>
            {item.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
