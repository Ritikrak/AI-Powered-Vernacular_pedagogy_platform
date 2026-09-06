import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
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
  School,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Volume2
} from 'lucide-react'
import { googleLoginUrl, lessonApi, classroomApi, type Role } from './api'
import { useApp } from './context'
import {
  StudentsModal,
  LessonsModal,
  DialectsModal,
  ComprehensionModal
} from './DashboardModals'
import GoogleClassroomPage from './GoogleClassroomPage'
import GoogleTranslatorPage from './GoogleTranslatorPage'
import LessonsPage from './LessonsPage'
import TranslatedLessonsPage from './TranslatedLessonsPage'
import StudentLearningPage from './StudentLearningPage'
import TeacherPanelPage from './TeacherPanelPage'
import StudentsPage from './StudentsPage'
import SettingsPage from './SettingsPage'

const teacherNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Live Classroom', icon: Headphones, path: '/live-classroom' },
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
  { label: 'Live Classroom', icon: Headphones, path: '/live-classroom' },
  { label: 'Lesson Catalog', icon: FileText, path: '/lessons' },
  { label: 'Translation Studio', icon: Languages, path: '/live-session' },
  { label: 'Settings', icon: Settings, path: '/settings' }
]

function Dashboard() {
  const { userName, role, preferredLanguage, students, lessons, dialects, activities, comprehensionGain } = useApp()
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState<'students' | 'lessons' | 'dialects' | 'comprehension' | null>(null)

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
          <b>अ</b>
          <span>
            {role === 'teacher' ? 'Teaching Language' : 'Mother Tongue'}
            <strong>{role === 'teacher' ? 'हिंदी (Hindi)' : `${preferredLanguage}`}</strong>
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
        <Metric
          icon={BarChart3}
          value={`${comprehensionGain}%`}
          label="Comprehension Gain"
          note="Vernacular Pedagogy"
          color="orange"
          badge="Analytics"
          actionHint="View Comprehension Analytics"
          onClick={() => setActiveModal('comprehension')}
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
      {activeModal === 'comprehension' && (
        <ComprehensionModal onClose={() => setActiveModal(null)} />
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
  const { role, signOut, preferredLanguage } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const allItems = [...teacherNav, ...studentNav]
  const currentItem = allItems.find(item => item.path === location.pathname)
  const title = currentItem ? currentItem.label : 'Dashboard'

  if (!role) return <Navigate to="/" replace />

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

          <div className="header-tools">
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium hidden sm:inline-block">
              {role === 'teacher' ? 'Hindi Source' : `Mother Tongue: ${preferredLanguage}`}
            </span>
            <button className="header-signout" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live-classroom" element={<GoogleClassroomPage role={role} />} />
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

function getLoginDetailsInfo(email: string, role: Role, passwordLength: number, fullName = '') {
  const norm = email.trim().toLowerCase()
  const nameNorm = fullName.trim()

  const isTeacherKeyword =
    norm.includes('teacher') ||
    norm.includes('prof') ||
    norm.includes('faculty') ||
    norm.includes('machet') ||
    norm.includes('educator')
  const isStudentKeyword =
    norm.includes('student') ||
    norm.includes('pathua') ||
    norm.includes('shiksha') ||
    norm.includes('pupil') ||
    norm.includes('learner') ||
    norm.includes('child')
  const isGoogle = norm.includes('@gmail.com') || norm.includes('@google.com')
  const isInstitution =
    norm.includes('@lokshiksha.in') || norm.includes('.edu') || norm.includes('.gov') || norm.includes('.ac.in')

  let detectedRole: Role = role
  if (isTeacherKeyword && !isStudentKeyword) detectedRole = 'teacher'
  else if (isStudentKeyword && !isTeacherKeyword) detectedRole = 'student'

  let PrimaryIcon = Shield
  let EmailIcon = Mail
  let emailColor = 'text-slate-400'
  let title = nameNorm || 'Sign in to Workspace'
  let badge = 'Workspace Account'
  let badgeClass = ''
  let identityClass = ''
  let iconBoxClass = 'default'
  let isVerified = false

  if (detectedRole === 'teacher' || isTeacherKeyword) {
    PrimaryIcon = GraduationCap
    EmailIcon = GraduationCap
    emailColor = 'text-emerald-500'
    badge = 'Teacher / शिक्षक Profile'
    badgeClass = 'teacher-text'
    identityClass = 'teacher-active'
    iconBoxClass = 'teacher'
    isVerified = isInstitution || isTeacherKeyword
    title = nameNorm
      ? `${nameNorm} (Teacher)`
      : (norm.split('@')[0] ? `${norm.split('@')[0]} (Teacher Studio)` : 'Teacher Classroom Studio')
  } else if (detectedRole === 'student' || isStudentKeyword) {
    PrimaryIcon = Sparkles
    EmailIcon = Sparkles
    emailColor = 'text-indigo-500'
    badge = 'Student / विद्यार्थी Profile'
    badgeClass = 'student-text'
    identityClass = 'student-active'
    iconBoxClass = 'student'
    isVerified = isInstitution || isStudentKeyword
    title = nameNorm
      ? `${nameNorm} (Student)`
      : (norm.split('@')[0] ? `${norm.split('@')[0]} (Learner Desk)` : 'Student Vernacular Desk')
  } else if (isGoogle) {
    PrimaryIcon = Globe
    EmailIcon = Globe
    emailColor = 'text-blue-500'
    badge = 'Google Workspace'
    badgeClass = 'google-text'
    identityClass = 'google-active'
    iconBoxClass = 'google'
    isVerified = true
    title = nameNorm ? `${nameNorm} (Google SSO)` : (norm.split('@')[0] ? `${norm.split('@')[0]} (Google SSO)` : 'Google Account')
  } else if (isInstitution) {
    PrimaryIcon = School
    EmailIcon = School
    emailColor = 'text-purple-500'
    badge = 'Institutional Pedagogy'
    badgeClass = ''
    identityClass = 'institution-active'
    iconBoxClass = 'institution'
    isVerified = true
    title = nameNorm ? `${nameNorm} (Institutional)` : (norm.split('@')[0] ? `${norm.split('@')[0]} (Institutional)` : 'Institution Member')
  } else if (nameNorm || norm.length > 0) {
    PrimaryIcon = UserCheck
    EmailIcon = UserCheck
    emailColor = 'text-slate-600'
    badge = 'Personal Account'
    title = nameNorm || norm.split('@')[0] || 'Learning Profile'
  }

  // Password icon and state
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
  const { role, signIn } = useApp()
  const [selected, setSelected] = useState<Role>('teacher')
  const [fullName, setFullName] = useState(() => localStorage.getItem('vernacular-name') || '')
  const [email, setEmail] = useState(() => localStorage.getItem('vernacular-email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [activeLang, setActiveLang] = useState<'santhali' | 'mundari' | 'ho' | 'kurukh'>('santhali')

  const loginInfo = getLoginDetailsInfo(email, selected, password.length, fullName)

  if (role) return <Navigate to="/dashboard" replace />

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
    if (demoRole === 'teacher') {
      setFullName('Teacher Demo')
      setEmail('teacher@lokshiksha.in')
      setPassword('teacher@2026')
    } else {
      setFullName('Student Demo')
      setEmail('student@lokshiksha.in')
      setPassword('student@2026')
    }
  }

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail)
    const norm = newEmail.toLowerCase()
    if (norm.includes('teacher') || norm.includes('prof') || norm.includes('educator')) {
      setSelected('teacher')
    } else if (norm.includes('student') || norm.includes('pupil') || norm.includes('learner')) {
      setSelected('student')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const resolvedName = fullName.trim() || (email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : (selected === 'teacher' ? 'Classroom Teacher' : 'Student'))
    void signIn(selected, resolvedName, email)
  }

  const DynamicCardIcon = loginInfo.PrimaryIcon
  const DynamicEmailIcon = loginInfo.EmailIcon
  const DynamicPasswordIcon = loginInfo.PasswordIcon

  return (
    <main className="auth-pro-wrapper">
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

          {/* Interactive Live Classroom Translation Card */}
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
                <span>👩🏾‍🏫 Teacher Live Speech (Hindi Source)</span>
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

          {/* DYNAMIC IDENTITY BADGE & ICON */}
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

          <div className="auth-card-header">
            <h2>Sign in to Workspace</h2>
            <p>Select your learning profile to access your synchronized classroom.</p>
          </div>

          <span className="role-picker-label">Select Workspace Role</span>
          <div className="role-cards-grid">
            <button
              type="button"
              id="role-teacher-btn"
              className={`role-card-pro ${selected === 'teacher' ? 'active' : ''}`}
              onClick={() => handleFillDemo('teacher')}
            >
              <div className="role-badge-check">
                <Check size={11} strokeWidth={3} />
              </div>
              <div className="role-icon-box">
                <GraduationCap size={18} />
              </div>
              <strong className="role-title">Teacher / शिक्षक</strong>
              <span className="role-desc">Upload lessons, live speech & class analytics</span>
            </button>

            <button
              type="button"
              id="role-student-btn"
              className={`role-card-pro ${selected === 'student' ? 'active' : ''}`}
              onClick={() => handleFillDemo('student')}
            >
              <div className="role-badge-check">
                <Check size={11} strokeWidth={3} />
              </div>
              <div className="role-icon-box">
                <Sparkles size={17} />
              </div>
              <strong className="role-title">Student / विद्यार्थी</strong>
              <span className="role-desc">Translated audio lessons & mother tongue desk</span>
            </button>
          </div>

          <div className="quick-demo-container">
            <div className="quick-demo-title">
              <span>⚡ One-Click Evaluation Presets</span>
              <span className="text-indigo-600 font-semibold">Click to autofill</span>
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
            <div className="input-field-group">
              <div className="input-label-row">
                <label htmlFor="auth-fullname">Full Name / पूरा नाम</label>
                {fullName.trim() && (
                  <span className="input-verified-tag">
                    <CheckCircle2 size={12} /> Name entered
                  </span>
                )}
              </div>
              <div className="input-with-icon">
                <span className="input-icon-left dynamic-icon active-icon text-indigo-500">
                  <UserCheck size={17} />
                </span>
                <input
                  id="auth-fullname"
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={selected === 'teacher' ? 'e.g. Dr. Rajesh Sharma' : 'e.g. Anita Soren'}
                />
              </div>
            </div>

            <div className="input-field-group">
              <div className="input-label-row">
                <label htmlFor="auth-email">Institutional Email</label>
                {loginInfo.isEmailValid && (
                  <span className="input-verified-tag">
                    <CheckCircle2 size={12} /> Valid email
                  </span>
                )}
              </div>
              <div className="input-with-icon">
                <span className={`input-icon-left dynamic-icon active-icon ${loginInfo.emailColor}`}>
                  <DynamicEmailIcon size={17} />
                </span>
                <input
                  id="auth-email"
                  required
                  type="email"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder={selected === 'teacher' ? 'teacher@lokshiksha.in' : 'student@lokshiksha.in'}
                />
              </div>
            </div>

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
                  onChange={e => setPassword(e.target.value)}
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

            <button type="submit" id="submit-login-btn" className="primary-cta-pro">
              <DynamicCardIcon size={18} />
              <span>Enter {selected === 'teacher' ? 'Teacher Dashboard' : 'Student Desk'}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="pro-auth-divider">
            <span>or federated access</span>
          </div>

          <a className="google-sso-btn" href={googleLoginUrl} id="google-sso-link">
            <svg className="google-icon-svg" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google Workspace</span>
          </a>

          <div className="auth-security-notice">
            <Shield size={13} className="text-slate-400" />
            <span>End-to-end encrypted · Local offline caching ready</span>
          </div>
        </div>
      </section>
    </main>
  )
}
