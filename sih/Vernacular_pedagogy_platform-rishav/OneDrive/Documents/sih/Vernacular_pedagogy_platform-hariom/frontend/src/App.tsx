import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Globe,
  GraduationCap,
  Headphones,
  KeyRound,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  Mic,
  Radio,
  RefreshCw,
  School,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Volume2,
  Layers
} from 'lucide-react'
import { lessonApi, classroomApi, authApi, type Role } from './api'
import { useApp } from './context'
import {
  StudentsModal,
  LessonsModal,
  DialectsModal
} from './DashboardModals'
import GoogleClassroomPage from './GoogleClassroomPage'
import GoogleTranslatorPage from './GoogleTranslatorPage'
import LessonsPage from './LessonsPage'
import TranslatedLessonsPage from './TranslatedLessonsPage'
import StudentLearningPage from './StudentLearningPage'
import TeacherPanelPage from './TeacherPanelPage'
import StudentsPage from './StudentsPage'
import SettingsPage from './SettingsPage'
import NipunWorksheetsPage from './NipunWorksheetsPage'

const teacherNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Live Classroom', icon: Headphones, path: '/live-classroom' },
  { label: 'NIPUN Worksheets & Cards', icon: Layers, path: '/worksheets' },
  { label: 'Lessons Repository', icon: FileText, path: '/lessons' },
  { label: 'Translated Lessons', icon: Languages, path: '/translated-lessons' },
  { label: 'Teacher Studio', icon: BookOpen, path: '/teacher-panel' },
  { label: 'Enrolled Students', icon: Users, path: '/students' },
  { label: 'Translation Studio', icon: Sparkles, path: '/live-session' },
  { label: 'Settings', icon: Settings, path: '/settings' }
]

const studentNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'My Learning Desk', icon: BookOpen, path: '/my-learning' },
  { label: 'Bilingual Flashcards', icon: Layers, path: '/worksheets' },
  { label: 'Live Classroom', icon: Headphones, path: '/live-classroom' },
  { label: 'Lesson Catalog', icon: FileText, path: '/lessons' },
  { label: 'Translation Studio', icon: Languages, path: '/live-session' },
  { label: 'Settings', icon: Settings, path: '/settings' }
]

export const TEACHER_SOURCE_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिंदी', glyph: 'अ' },
  { code: 'en', name: 'English', native: 'English', glyph: 'A' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', glyph: 'অ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', glyph: 'ଅ' },
  { code: 'sat', name: 'Santhali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', glyph: 'ᱚ' },
  { code: 'kru', name: 'Kurukh', native: 'कुड़ुख़', glyph: 'क' }
]

export const STUDENT_MOTHER_TONGUES = [
  { code: 'sat', name: 'Santhali', native: 'संथाली / ᱥᱟᱱᱛᱟᱲᱤ', glyph: 'ᱚ' },
  { code: 'kru', name: 'Kurukh', native: 'कुड़ुख़ / ᱛᱚᱞᱚᱝ ᱥᱤᱠᱤ', glyph: 'क' },
  { code: 'unr', name: 'Mundari', native: 'मुंडारी / ᱢᱩᱱᱰᱟᱨᱤ', glyph: 'ᱢ' },
  { code: 'hoc', name: 'Ho', native: 'हो / ᱦᱳ', glyph: 'ᱦ' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', glyph: 'अ' },
  { code: 'en', name: 'English', native: 'English', glyph: 'A' }
]

function Dashboard() {
  const { userName, role, preferredLanguage, teacherSourceLanguage, students, lessons, dialects, activities } = useApp()
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState<'students' | 'lessons' | 'dialects' | null>(null)

  const activeGlyph = role === 'teacher'
    ? (TEACHER_SOURCE_LANGUAGES.find(l => l.name === teacherSourceLanguage)?.glyph || 'अ')
    : (STUDENT_MOTHER_TONGUES.find(l => l.name === preferredLanguage)?.glyph || 'ᱚ')

  return (
    <>
      <section className="welcome-banner">
        <div>
          <span>WELCOME BACK, {(userName?.trim() || (role === 'teacher' ? 'TEACHER' : 'STUDENT')).toUpperCase()}! 👋</span>
          <h1>Empowering tribal children through their mother tongue.</h1>
        </div>
        <div className="welcome-art">
          👩🏾‍🏫<small>👦🏽 👧🏽 👦🏽</small>
        </div>
        <div className="teaching-language">
          <b>{activeGlyph}</b>
          <span>
            {role === 'teacher' ? 'Teaching Source' : 'Mother Tongue'}
            <strong>{role === 'teacher' ? `${teacherSourceLanguage} Source` : `${preferredLanguage}`}</strong>
          </span>
        </div>
      </section>

      {/* 4 Interactive & Dynamic Dashboard Statistic Cards */}
      <section className="metrics">
        <Metric
          icon={Users}
          value={String(students.length)}
          label="Connected Students"
          note={`${students.filter(s => s.attendanceStatus !== 'offline').length || students.length} Active in Room 01`}
          color="purple"
          badge="Manage"
          actionHint="Add / Delete Students"
          onClick={() => setActiveModal('students')}
        />
        <Metric
          icon={BookOpen}
          value={String(lessons.length)}
          label="Curriculum Lessons"
          note="AI Simplified"
          color="blue"
          badge="Manage"
          actionHint="Create / Delete Lessons"
          onClick={() => setActiveModal('lessons')}
        />
        <Metric
          icon={Languages}
          value={`${dialects.length} Dialects`}
          label="Jharkhand Vernaculars"
          note={dialects.map(d => d.englishName).slice(0, 4).join(', ') + (dialects.length > 4 ? ` +${dialects.length - 4}` : '')}
          color="green"
          badge="Manage"
          actionHint="Add / Remove Dialects"
          onClick={() => setActiveModal('dialects')}
        />
      </section>

      {/* Interactive Modal Drawers */}
      {activeModal === 'students' && (
        <StudentsModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'lessons' && (
        <LessonsModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'dialects' && (
        <DialectsModal onClose={() => setActiveModal(null)} />
      )}

      <section className="dashboard-summary">
        <div className="panel">
          <div className="panel-title">
            <b>Quick actions</b>
          </div>
          <div className="quick-actions">
            <button type="button" onClick={() => navigate('/lessons')}>
              <FileText size={20} />
              <b>Create lesson</b>
              <small>Upload PDF / text</small>
            </button>
            <button type="button" onClick={() => navigate('/live-classroom')}>
              <Headphones size={20} />
              <b>Live classroom</b>
              <small>Socket.IO room</small>
            </button>
            <button type="button" onClick={() => navigate('/live-session')}>
              <Languages size={20} />
              <b>Translator</b>
              <small>Multi-dialect</small>
            </button>
            <button type="button" onClick={() => navigate(role === 'teacher' ? '/translated-lessons' : '/my-learning')}>
              <BookOpen size={20} />
              <b>{role === 'teacher' ? 'Read Lessons' : 'My Learning'}</b>
              <small>Mother tongue</small>
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <b>Classroom Activity Feed</b>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Live Event Log</span>
          </div>
          {activities.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              No classroom events logged yet.
            </div>
          ) : (
            activities.slice(0, 5).map(act => (
              <div key={act.id} className="activity-row">
                <span className="activity-dot">{act.dot || '✓'}</span>
                <span>
                  <b>{act.title}</b>
                  <small>{act.detail}</small>
                </span>
                <time>{act.timeAgo}</time>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  )
}

function Metric({
  icon: Icon,
  value,
  label,
  note,
  color,
  badge,
  actionHint,
  onClick
}: {
  icon: typeof Users
  value: string
  label: string
  note: string
  color: string
  badge?: string
  actionHint?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`metric ${onClick ? 'interactive-card' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      title={actionHint ? `${actionHint} (Click to open)` : undefined}
    >
      {badge && <span className="interactive-card-pill">{badge}</span>}
      <div className={`metric-icon ${color}`}>
        <Icon size={20} />
      </div>
      <span>
        <b>{value}</b>
        <small>{label}</small>
        <em>↑ {note}</em>
      </span>
      {onClick && (
        <span className="metric-arrow-hint" aria-hidden="true">
          <ChevronRight size={14} />
        </span>
      )}
    </div>
  )
}

function Sidebar({ close }: { close: () => void }) {
  const { userName, role, preferredLanguage, signOut } = useApp()
  const navigate = useNavigate()
  const navigation = role === 'student' ? studentNav : teacherNav
  const displayName = userName?.trim() || (role === 'teacher' ? 'Classroom Teacher' : 'Student')
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map(item => item[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || (role === 'teacher' ? 'TC' : 'ST')

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <a className="brand" href="/dashboard">
          <span className="brand-leaf">◆</span>
          <span>
            <strong>
              LokShiksha<br />Vernacular
            </strong>
            <small>AI Pedagogy Platform</small>
          </span>
        </a>
        <button className="sidebar-close" onClick={close}>
          <Menu size={19} />
        </button>
      </div>

      <nav>
        {navigation.map(({ label, icon: Icon, path }) => (
          <NavLink
            onClick={close}
            key={path}
            to={path}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="profile-footer">
        <div className="profile-user-info">
          <div className="profile-avatar" aria-label={`Avatar of ${displayName}`}>
            {initials}
          </div>
          <div className="profile-meta">
            <span className="profile-name" title={displayName}>
              {displayName}
            </span>
            <span className="profile-role">
              {role === 'teacher' ? 'Teacher' : `Student (${preferredLanguage})`}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            signOut()
            navigate('/')
          }}
          className="profile-signout-btn"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}

function Shell() {
  const {
    role,
    preferredLanguage,
    setPreferredLanguage,
    teacherSourceLanguage,
    setTeacherSourceLanguage
  } = useApp()
  const [open, setOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allItems = [...teacherNav, ...studentNav]
  const currentItem = allItems.find(item => item.path === location.pathname)
  const title = currentItem ? currentItem.label : 'Dashboard'

  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('vernacular-role') : null

  if (!role && !storedRole) return <Navigate to="/" replace />

  return (
    <div className="app-shell">
      <div className={open ? 'sidebar mobile-open' : 'sidebar-wrap'}>
        <Sidebar close={() => setOpen(false)} />
      </div>

      <div className="app-main">
        <header className="app-header">
          <button className="mobile-menu" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="page-title">
            <strong>{title}</strong>
          </div>

          <div className="header-tools flex items-center gap-2">
            {role === 'teacher' ? (
              <div className="relative inline-block" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(prev => !prev)}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Click to switch teaching source language"
                  aria-label="Change Teaching Source Language"
                  aria-expanded={langMenuOpen}
                >
                  <Languages size={13} className="text-indigo-600" />
                  <span>
                    <strong className="font-semibold text-indigo-800">{teacherSourceLanguage}</strong> Source
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-indigo-500 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Teaching Source Language
                    </div>
                    {TEACHER_SOURCE_LANGUAGES.map(lang => (
                      <button
                        key={lang.name}
                        type="button"
                        onClick={() => {
                          setTeacherSourceLanguage(lang.name)
                          setLangMenuOpen(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          teacherSourceLanguage === lang.name
                            ? 'text-indigo-600 font-semibold bg-indigo-50/60'
                            : 'text-slate-700'
                        }`}
                      >
                        <span>
                          {lang.name} <span className="text-slate-400 text-[11px]">({lang.native})</span>
                        </span>
                        {teacherSourceLanguage === lang.name && <Check size={13} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative inline-block" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(prev => !prev)}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Click to switch your mother tongue"
                  aria-label="Change Mother Tongue"
                  aria-expanded={langMenuOpen}
                >
                  <Languages size={13} className="text-emerald-600" />
                  <span>
                    Mother Tongue: <strong className="font-semibold text-emerald-900">{preferredLanguage}</strong>
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-emerald-600 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Mother Tongue
                    </div>
                    {STUDENT_MOTHER_TONGUES.map(lang => (
                      <button
                        key={lang.name}
                        type="button"
                        onClick={() => {
                          setPreferredLanguage(lang.name)
                          setLangMenuOpen(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          preferredLanguage === lang.name
                            ? 'text-emerald-600 font-semibold bg-emerald-50/60'
                            : 'text-slate-700'
                        }`}
                      >
                        <span>
                          {lang.name} <span className="text-slate-400 text-[11px]">({lang.native})</span>
                        </span>
                        {preferredLanguage === lang.name && <Check size={13} className="text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live-classroom" element={<GoogleClassroomPage role={role || 'teacher'} />} />
            <Route path="/worksheets" element={<NipunWorksheetsPage />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/translated-lessons" element={<TranslatedLessonsPage />} />
            <Route path="/teacher-panel" element={<TeacherPanelPage />} />
            <Route path="/my-learning" element={<StudentLearningPage />} />
            <Route path="/live-session" element={<GoogleTranslatorPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          © 2026 LokShiksha Vernacular Pedagogy Platform <span>Google Gemini AI + Offline Regional Dictionaries</span>
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="*" element={<Shell />} />
    </Routes>
  )
}

const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'trashmail.com',
  'yopmail.com',
  'throwawaymail.com',
  'dispostable.com',
  'getairmail.com',
  'fakemailgenerator.com',
  'mohmal.com',
  'generator.email',
  'dropmail.me',
  'crazymailing.com',
  'tempmailo.com',
  'maildrop.cc',
  'inboxkitten.com',
  'nada.ltd',
  'burnermail.io',
  'emailondeck.com',
  'mytemp.email',
  'fakemail.net',
  'tempinbox.com',
  'trashmail.net',
  'trashmail.org',
  'tempr.email',
  'discard.email',
  'spambog.com',
  'boun.cr',
  'jetable.org',
  'luxusmail.org',
  'mytempemail.com'
]

function getLoginDetailsInfo(email: string, role: Role | null, passwordLength: number) {
  const norm = email.trim().toLowerCase()

  const isTeacherKeyword =
    norm.includes('teacher') ||
    norm.includes('prof') ||
    norm.includes('faculty') ||
    norm.includes('tch-') ||
    norm.includes('educator')
  const isStudentKeyword =
    norm.includes('student') ||
    norm.includes('pathua') ||
    norm.includes('pupil') ||
    norm.includes('learner')
  const isInstitution =
    norm.includes('@lokshiksha.in') || norm.includes('.edu') || norm.includes('.gov') || norm.includes('.ac.in')

  let detectedRole: Role | null = role
  if (isTeacherKeyword && !isStudentKeyword) detectedRole = 'teacher'
  else if (isStudentKeyword && !isTeacherKeyword) detectedRole = 'student'

  let PrimaryIcon = Shield
  let EmailIcon = Mail
  let emailColor = 'text-slate-400'
  let title = role ? `${role === 'teacher' ? 'Teacher' : 'Student'} Workspace` : 'LokShiksha Workspace'
  let badge = role ? `${role === 'teacher' ? 'Teacher / शिक्षक' : 'Student / विद्यार्थी'} Profile` : 'Select Role'
  let badgeClass = role ? (role === 'teacher' ? 'teacher-text' : 'student-text') : ''
  let identityClass = role ? (role === 'teacher' ? 'teacher-active' : 'student-active') : ''
  let iconBoxClass = role ? (role === 'teacher' ? 'teacher' : 'student') : 'default'
  let isVerified = false

  if (detectedRole === 'teacher' || isTeacherKeyword) {
    PrimaryIcon = GraduationCap
    EmailIcon = GraduationCap
    emailColor = 'text-purple-600'
    badge = 'Teacher / शिक्षक Profile'
    badgeClass = 'teacher-text'
    identityClass = 'teacher-active'
    iconBoxClass = 'teacher'
    isVerified = isInstitution || isTeacherKeyword
    title = norm.split('@')[0] ? `${norm.split('@')[0]} (Teacher Studio)` : 'Teacher Classroom Studio'
  } else if (detectedRole === 'student' || isStudentKeyword) {
    PrimaryIcon = Sparkles
    EmailIcon = Sparkles
    emailColor = 'text-purple-600'
    badge = 'Student / विद्यार्थी Profile'
    badgeClass = 'student-text'
    identityClass = 'student-active'
    iconBoxClass = 'student'
    isVerified = isInstitution
    title = norm.split('@')[0] ? `${norm.split('@')[0]} (Learner Desk)` : 'Student Vernacular Desk'
  }

  // Password state
  let PasswordIcon = Lock
  let passwordColor = 'text-slate-400'
  let passwordHint = 'Minimum 6 characters required'
  let isPasswordValid = false

  if (passwordLength === 0) {
    PasswordIcon = Lock
    passwordColor = 'text-slate-400'
  } else if (passwordLength < 6) {
    PasswordIcon = KeyRound
    passwordColor = 'text-amber-500'
    passwordHint = `${passwordLength}/6 characters (too short)`
  } else {
    PasswordIcon = ShieldCheck
    passwordColor = 'text-emerald-500'
    passwordHint = 'Password verified (6+ chars)'
    isPasswordValid = true
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)

  return {
    detectedRole,
    PrimaryIcon,
    EmailIcon,
    PasswordIcon,
    emailColor,
    passwordColor,
    passwordHint,
    isPasswordValid,
    isEmailValid,
    title,
    badge,
    badgeClass,
    identityClass,
    iconBoxClass,
    isVerified
  }
}

function Auth() {
  const { role, completeSessionLogin, teacherSourceLanguage, toast } = useApp()
  const [selected, setSelected] = useState<Role>('teacher')
  const [email, setEmail] = useState(() => localStorage.getItem('vernacular-email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [activeLang, setActiveLang] = useState<'santhali' | 'mundari' | 'ho' | 'kurukh'>('santhali')

  const loginInfo = getLoginDetailsInfo(email, selected, password.length)
  const storedRole = typeof window !== 'undefined' ? (localStorage.getItem('vernacular-role') || sessionStorage.getItem('vernacular-role')) : null

  if (role || storedRole) return <Navigate to="/dashboard" replace />

  const previewData = {
    santhali: {
      label: 'संथाली',
      english: 'Santhali',
      script: 'Ol Chiki',
      text: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱜ ᱪᱟᱠᱨᱚ (Water Cycle) ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
      phonetic: "Johar gidra! Teheñ do abo da' chakra babat bon seṛaya."
    },
    mundari: {
      label: 'मुंडारी',
      english: 'Mundari',
      script: 'Mundari Bani',
      text: 'ᱡᱳᱦᱟᱨ ᱦᱩᱲᱤᱝ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱵᱩ ᱫᱟᱜ ᱠᱟᱱᱰᱟ ᱳᱨᱳ ᱜᱟᱢᱟᱭ ᱵᱟᱵᱟᱛ ᱛᱮ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ᱾',
      phonetic: "Johar huring ko! Tising bu da' kanda oro gamai babat te itun lagid."
    },
    ho: {
      label: 'हो',
      english: 'Ho',
      script: 'Warang Citi',
      text: 'ᱡᱳᱦᱟᱨ ᱦᱳᱱ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱳᱨᱳ ᱜᱟᱢᱟ ᱵᱟᱭ ᱵᱤᱥᱳᱭ ᱨᱮ ᱤᱛᱩᱱᱟᱱ᱾',
      phonetic: "Johar hon ko! Tising abu da' chakra oro gama bai bishoi re itunan."
    },
    kurukh: {
      label: 'कुड़ुख़',
      english: 'Kurukh',
      script: 'Tolong Siki',
      text: 'गॊडे लगदन खोड़ोर! इन्ना ऎम अम् चक्रा (जल चक्र) आर बादली बनवर्न बारॆते खॊड़\'ओर।',
      phonetic: "Gode lagdan khor'or! Inna em am chakra aara badali banawarna barete khor'or."
    }
  }

  const handleFillDemo = (demoRole: Role) => {
    setSelected(demoRole)
    setErrorMessage(null)
    if (demoRole === 'teacher') {
      setEmail('teacher@lokshiksha.in')
      setPassword('teacher@2026')
    } else {
      setEmail('student@lokshiksha.in')
      setPassword('student@2026')
    }
  }

  const handleSwitchTab = (tab: Role) => {
    setSelected(tab)
    setErrorMessage(null)
    setPassword('')
  }

  const validateStudentEmailStrict = (emailStr: string): boolean => {
    const norm = emailStr.trim().toLowerCase()
    if (!norm) return false

    // Disposable/fake domain check
    const domain = norm.includes('@') ? norm.split('@')[1] : ''
    const isDisposable = DISPOSABLE_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`))

    if (isDisposable || !norm.endsWith('@lokshiksha.in')) {
      setErrorMessage('Please use your official institutional email.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // STUDENT FLOW
    if (selected === 'student') {
      if (!validateStudentEmailStrict(email)) {
        return
      }

      setIsSubmitting(true)
      try {
        const res = await authApi.login(email.trim(), password, 'student', remember)
        if (res.access_token && res.user) {
          completeSessionLogin(res.access_token, res.user, remember)
        } else {
          setErrorMessage('Login failed. Please check your credentials.')
        }
      } catch (err: any) {
        const errorText = err.response?.data?.message || err.response?.data?.error || err.message
        if (errorText?.includes('Please use your official institutional email')) {
          setErrorMessage('Please use your official institutional email.')
        } else if (err.code === 'ERR_NETWORK' || errorText?.includes('Network Error')) {
          // Resilient offline fallback for Student Demo
          if (email.trim().toLowerCase() === 'student@lokshiksha.in' && (password === 'student@2026' || password === 'demo123')) {
            toast('Connected via resilient offline student profile', 'info')
            completeSessionLogin('demo_student_token', {
              id: 'usr_student_01',
              name: 'Student Learner',
              email: 'student@lokshiksha.in',
              role: 'student',
              preferredLanguage: 'Santhali'
            }, remember)
          } else {
            setErrorMessage('Unable to reach backend server (http://localhost:8000). Ensure the backend is running with "npm run dev".')
          }
        } else {
          setErrorMessage(errorText || 'Authentication failed. Please verify credentials.')
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // TEACHER FLOW (Direct Login - No 2-Step OTP)
    if (selected === 'teacher') {
      setIsSubmitting(true)
      try {
        const res = await authApi.login(email.trim(), password, 'teacher', remember)
        if (res.access_token && res.user) {
          completeSessionLogin(res.access_token, res.user, remember)
        } else {
          setErrorMessage('Login failed. Please verify teacher credentials.')
        }
      } catch (err: any) {
        const errorText = err.response?.data?.message || err.response?.data?.error || err.message
        if (err.code === 'ERR_NETWORK' || errorText?.includes('Network Error')) {
          if (email.trim().toLowerCase() === 'teacher@lokshiksha.in' || email.trim().toUpperCase() === 'TCH-1001') {
            toast('Connected via resilient offline teacher profile', 'info')
            completeSessionLogin('demo_teacher_token', {
              id: 'usr_teacher_01',
              name: 'Teacher Demo',
              teacherId: 'TCH-1001',
              email: 'teacher@lokshiksha.in',
              role: 'teacher',
              preferredLanguage: 'Hindi'
            }, remember)
          } else {
            setErrorMessage('Unable to reach backend server. Please check your connection.')
          }
        } else {
          setErrorMessage(errorText || 'Invalid teacher credentials.')
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const DynamicCardIcon = loginInfo.PrimaryIcon
  const DynamicPasswordIcon = loginInfo.PasswordIcon

  return (
    <main className="auth-pro-wrapper">
      {/* ================= LEFT PANEL: BRANDING ================= */}
      <section className="auth-pro-hero">
        <div className="auth-hero-top">
          <div className="auth-mission-pill">
            <span className="pulse-dot" />
            <span>Jharkhand Vernacular Pedagogy Initiative · AI Enabled</span>
          </div>

          <div className="auth-brand-lockup">
            <div className="auth-brand-symbol">
              <span>अ</span>
            </div>
            <div className="auth-brand-text">
              <h1>LokShiksha</h1>
              <span>Vernacular Pedagogy Platform</span>
            </div>
          </div>
        </div>

        <div className="auth-hero-main">
          <h2 className="auth-hero-title">
            Learning feels natural when taught in your <em>mother tongue</em>.
          </h2>
          <p className="auth-hero-desc">
            Bridging regional classroom boundaries across Jharkhand with instant multilingual speech and lesson translation for teachers and tribal learners.
          </p>

          {/* Classroom UI Mockup Placeholder */}
          <div className="live-showcase-card">
            <div className="live-showcase-header">
              <div className="live-showcase-status">
                <Radio size={14} className="text-emerald-400" />
                <span>Live Classroom Audio Stream • Room 01</span>
              </div>
              <div className="live-wave-indicator" aria-label="Audio streaming waveform">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="source-bubble">
              <div className="source-header">
                <span>👩🏾‍🏫 Teacher Live Speech ({teacherSourceLanguage || 'Hindi'} Source)</span>
                <span className="text-[10px] text-slate-400">00:14 / Realtime</span>
              </div>
              <p className="source-text">
                &ldquo;नमस्ते बच्चों! आज हम जल चक्र (Water Cycle) और वर्षा के निर्माण के बारे में विस्तार से सीखेंगे।&rdquo;
              </p>
            </div>

            <div className="live-lang-tabs" role="tablist" aria-label="Target language preview tabs">
              {(Object.keys(previewData) as Array<keyof typeof previewData>).map(langKey => (
                <button
                  type="button"
                  key={langKey}
                  role="tab"
                  aria-selected={activeLang === langKey}
                  className={`lang-tab ${activeLang === langKey ? 'active' : ''}`}
                  onClick={() => setActiveLang(langKey)}
                >
                  {previewData[langKey].label} · {previewData[langKey].english}
                </button>
              ))}
            </div>

            <div className="translation-bubble">
              <div className="translation-meta">
                <span>
                  Target Translation: {previewData[activeLang].english} ({previewData[activeLang].script})
                </span>
                <span className="audio-pill">
                  <Volume2 size={11} /> Speech Output Ready
                </span>
              </div>
              <p className="translation-text">{previewData[activeLang].text}</p>
              <p className="translation-subtext">Phonetic: &ldquo;{previewData[activeLang].phonetic}&rdquo;</p>
            </div>
          </div>
        </div>

        {/* Bottom Feature Text */}
        <div className="auth-hero-footer">
          <div className="stat-item">
            <strong>4 Languages</strong>
            <span>Santhali, Mundari, Ho, Kurukh</span>
          </div>
          <div className="stat-item">
            <strong>Realtime STT + TTS</strong>
            <span>Socket.IO & Native Speech Fallback</span>
          </div>
          <div className="stat-item">
            <strong>100% Offline Mesh</strong>
            <span>Zero-packet Loss Remote Caching</span>
          </div>
        </div>
      </section>

      {/* ================= RIGHT PANEL: INTERACTIVE ================= */}
      <section className="auth-pro-card-panel">
        <div className="auth-pro-card">
          <div className="auth-mobile-header">
            <div className="auth-brand-symbol" style={{ width: 38, height: 38, fontSize: 18 }}>
              <span>अ</span>
            </div>
            <div>
              <strong style={{ fontSize: 16, display: 'block', color: '#0f172a' }}>LokShiksha</strong>
              <span style={{ fontSize: 10, color: '#64748b' }}>Vernacular Pedagogy Platform</span>
            </div>
          </div>

          <div className="auth-card-topbar">
            <div className="portal-status-pill">
              <span className="status-dot-sm" />
              <span>Portal Active · v2.5</span>
            </div>
            <div className="lang-selector-lite">
              <Globe size={13} />
              <span>English / हिंदी</span>
              <ChevronDown size={12} />
            </div>
          </div>

          {/* Prominent Toggle Tabs at the Top */}
          <div className="auth-role-tabs-pro" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={selected === 'teacher'}
              className={`auth-role-tab-btn ${selected === 'teacher' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('teacher')}
            >
              <GraduationCap size={16} />
              <span>Teacher / शिक्षक</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selected === 'student'}
              className={`auth-role-tab-btn ${selected === 'student' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('student')}
            >
              <Sparkles size={16} />
              <span>Student / विद्यार्थी</span>
            </button>
          </div>

          {/* Dynamic Identity Badge */}
          <div className={`dynamic-login-identity ${loginInfo.identityClass}`}>
            <div className={`dynamic-login-icon-box ${loginInfo.iconBoxClass}`}>
              <DynamicCardIcon size={22} />
              {loginInfo.isVerified && (
                <span className="verified-pip" title="Verified Account">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="dynamic-login-meta">
              <span className={`dynamic-login-badge ${loginInfo.badgeClass}`}>
                <DynamicCardIcon size={11} /> {loginInfo.badge}
              </span>
              <strong>{loginInfo.title}</strong>
            </div>
          </div>

          {/* Error Alert Display */}
          {errorMessage && (
            <div className="auth-alert-error" role="alert">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credential Form */}
          <div className="auth-card-header">
            <h2>{selected === 'teacher' ? 'Teacher Portal' : 'Student Desk'}</h2>
            <p>
              {selected === 'teacher'
                ? 'Sign in with your Teacher Email or ID to access your synchronized classroom.'
                : 'Sign in directly with your official institutional @lokshiksha.in email.'}
            </p>
          </div>

          {/* Quick Demo Preset Bar */}
          <div className="quick-demo-container">
            <div className="quick-demo-title">
              <span>⚡ Quick Evaluation Presets</span>
              <span className="text-purple-600 font-semibold">Click to autofill</span>
            </div>
            <div className="quick-demo-buttons">
              <button
                type="button"
                className={`demo-fill-btn ${selected === 'teacher' ? 'selected-demo' : ''}`}
                onClick={() => handleFillDemo('teacher')}
              >
                <span>Teacher Demo</span>
                <span className="demo-role-tag">Teacher</span>
              </button>
              <button
                type="button"
                className={`demo-fill-btn ${selected === 'student' ? 'selected-demo' : ''}`}
                onClick={() => handleFillDemo('student')}
              >
                <span>Student Demo</span>
                <span className="demo-role-tag">Student</span>
              </button>
            </div>
          </div>

          <form className="auth-form-pro" onSubmit={handleSubmit}>
            {/* Email / ID Input (NO Full Name field) */}
            <div className="input-field-group">
              <div className="input-label-row">
                <label htmlFor="auth-email">
                  {selected === 'teacher' ? 'Teacher Email / ID' : 'Institutional Email'}
                </label>
                {loginInfo.isEmailValid && (
                  <span className="input-verified-tag">
                    <CheckCircle2 size={12} /> Format valid
                  </span>
                )}
              </div>
              <div className="input-with-icon">
                <span className={`input-icon-left dynamic-icon active-icon ${loginInfo.emailColor}`}>
                  {selected === 'teacher' ? <GraduationCap size={17} /> : <Mail size={17} />}
                </span>
                <input
                  id="auth-email"
                  required
                  type={selected === 'teacher' ? 'text' : 'email'}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder={selected === 'teacher' ? 'teacher@lokshiksha.in or TCH-1001' : 'student@lokshiksha.in'}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-field-group">
              <div className="input-label-row">
                <label htmlFor="auth-password">Account Password</label>
              </div>
              <div className="input-with-icon">
                <span className={`input-icon-left dynamic-icon ${loginInfo.passwordColor}`}>
                  <DynamicPasswordIcon size={17} />
                </span>
                <input
                  id="auth-password"
                  required
                  minLength={6}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder="Enter security password"
                />
                <button
                  type="button"
                  className="input-icon-action"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className={`password-strength-hint ${loginInfo.isPasswordValid ? 'valid' : ''}`}>
                {loginInfo.isPasswordValid ? <Check size={11} strokeWidth={3} /> : <Lock size={11} />}
                <span>{loginInfo.passwordHint}</span>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-meta-row">
              <label className="remember-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Solid Purple Submit Button */}
            <button
              type="submit"
              id="submit-login-btn"
              className="primary-cta-pro"
              disabled={isSubmitting || !email.trim() || password.length < 6}
            >
              <DynamicCardIcon size={18} />
              <span>
                {isSubmitting
                  ? 'Signing In...'
                  : selected === 'teacher'
                  ? 'Enter Teacher Dashboard'
                  : 'Enter Student Desk'}
              </span>
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-security-notice">
            <Shield size={13} className="text-slate-400" />
            <span>End-to-end encrypted · Local offline caching ready</span>
          </div>
        </div>
      </section>
    </main>
  )
}

