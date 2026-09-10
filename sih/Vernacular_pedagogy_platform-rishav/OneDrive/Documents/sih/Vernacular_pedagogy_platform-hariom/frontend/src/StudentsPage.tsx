import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react'
import { classroomApi, type RoomState } from './api'
import { useApp, type StudentItem } from './context'

export default function StudentsPage() {
  const { role, userName, toast, students, addStudent, deleteStudent } = useApp()
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(null)
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('All')

  // Form states
  const [name, setName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('Santhali')
  const [gradeLevel, setGradeLevel] = useState('Class 1')
  const [section, setSection] = useState('A')
  const [rollNumber, setRollNumber] = useState('')
  const [formSuccessMessage, setFormSuccessMessage] = useState('')

  const fetchRoomData = async () => {
    setLoading(true)
    try {
      const data = await classroomApi.getRoomDetails('main')
      setRoomState(data)
    } catch {
      toast('Could not fetch active classroom state', 'info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoomData()
    const timer = setInterval(fetchRoomData, 10000)
    return () => clearInterval(timer)
  }, [])

  const handleEnroll = (keepFormOpen: boolean = false) => {
    if (!name.trim()) return
    const newRoll = rollNumber.trim() || String(students.length + 1).padStart(2, '0')
    const added = addStudent({
      name: name.trim(),
      preferredLanguage,
      gradeLevel,
      section,
      rollNumber: newRoll,
      score: Math.floor(Math.random() * 7 + 92),
      attendanceStatus: 'active'
    })

    setRecentAddedId(added.id)
    setTimeout(() => setRecentAddedId(null), 4000)

    setFormSuccessMessage(`"${added.name}" enrolled into ${added.gradeLevel}!`)
    setTimeout(() => setFormSuccessMessage(''), 3000)

    setName('')
    const parsedRoll = parseInt(newRoll, 10)
    if (!isNaN(parsedRoll)) {
      setRollNumber(String(parsedRoll + 1).padStart(2, '0'))
    } else {
      setRollNumber('')
    }

    if (!keepFormOpen) {
      setShowAddForm(false)
    }
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleEnroll(false)
  }

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id)
      setStudentToDelete(null)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.preferredLanguage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.rollNumber && student.rollNumber.includes(searchQuery)) ||
      (student.gradeLevel && student.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesClass = filterClass === 'All' || student.gradeLevel === filterClass
    return matchesSearch && matchesClass
  })

  const languageCounts = students.reduce((acc, s) => {
    const lang = s.preferredLanguage || 'Santhali'
    acc[lang] = (acc[lang] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <section className="page-card students-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">CLASSROOM ROSTER & DEMOGRAPHICS</span>
          <h1>Enrolled Students</h1>
          <p>Monitor student attendance, active vernacular preferences, and classroom participation across Classes 1 to 8.</p>
        </div>

        <div className="flex items-center gap-2">
          {formSuccessMessage && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fadeInModal hidden sm:inline">
              ✓ {formSuccessMessage}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus size={15} /> {showAddForm ? 'Hide Form' : '+ Enroll Student'}
          </button>
          <button
            type="button"
            onClick={fetchRoomData}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Roster
          </button>
        </div>
      </div>

      {/* Delete Confirmation Banner */}
      {studentToDelete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 my-4 flex items-center justify-between animate-fadeInModal">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-900">
              Are you sure you want to remove student <strong>&quot;{studentToDelete.name}&quot;</strong> ({studentToDelete.gradeLevel})? This will decrement the connected count.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStudentToDelete(null)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Add Student Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4 space-y-3 animate-scaleUpModal">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <strong className="text-xs font-bold text-slate-900">Enroll Student (Classes 1 to 8)</strong>
            <span className="text-[11px] text-slate-500 font-medium">Add as many students as needed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Hansda"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Mother Tongue Dialect *</label>
              <select
                value={preferredLanguage}
                onChange={e => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Santhali">संताली (Santhali)</option>
                <option value="Mundari">मुंडारी (Mundari)</option>
                <option value="Ho">हो (Ho)</option>
                <option value="Kurukh">कुड़ुख़ (Kurukh)</option>
                <option value="Hindi">हिंदी (Hindi)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Grade Level (Class 1 to 8)</label>
              <select
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Section & Roll No</label>
              <div className="flex gap-2">
                <select
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  className="w-20 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A">Sec A</option>
                  <option value="B">Sec B</option>
                  <option value="C">Sec C</option>
                  <option value="D">Sec D</option>
                </select>
                <input
                  type="text"
                  placeholder="Roll No"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <span className="text-[10px] text-slate-400">
              Tip: Click &quot;Enroll &amp; Add Another&quot; to add multiple students without closing this form.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleEnroll(true)}
                className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
              >
                <Plus size={13} /> Enroll &amp; Add Another
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Save Student
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Dialect Demographics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        {Object.entries(languageCounts).map(([lang, count]) => (
          <div key={lang} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-2xl font-bold font-mono text-indigo-600 block">{count}</span>
            <span className="text-xs font-semibold text-slate-800 block mt-1">{lang}</span>
            <span className="text-[10px] text-slate-400">
              {students.length > 0 ? Math.round((count / students.length) * 100) : 0}% of classroom
            </span>
          </div>
        ))}
      </div>

      {/* Classroom Status Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <strong className="text-sm text-slate-900 block">
              Room 01: {roomState?.teacherOnline ? 'Teacher is Online' : 'Waiting for Teacher'}
            </strong>
            <span className="text-xs text-slate-500">
              Teacher: {roomState?.teacherName || (role === 'teacher' ? userName : '') || 'Classroom Teacher'} • {students.length} Enrolled Students (Class 1 to 8)
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search roster by student name, roll number, or dialect..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Classes (1 to 8)</option>
          <option value="Class 1">Class 1</option>
          <option value="Class 2">Class 2</option>
          <option value="Class 3">Class 3</option>
          <option value="Class 4">Class 4</option>
          <option value="Class 5">Class 5</option>
          <option value="Class 6">Class 6</option>
          <option value="Class 7">Class 7</option>
          <option value="Class 8">Class 8</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <strong className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Student Attendance Roster
          </strong>
          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-700 font-bold">{filteredStudents.length}</strong> of {students.length} Students
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students enrolled yet. Click &quot;+ Enroll Student&quot; above.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students match &quot;{searchQuery || filterClass}&quot;.
            </div>
          ) : (
            filteredStudents.map(student => {
              const isRecent = student.id === recentAddedId
              return (
                <div
                  key={student.id}
                  className={`px-5 py-3.5 flex items-center justify-between transition-colors ${
                    isRecent ? 'bg-emerald-50/90 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                      isRecent ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 block font-bold">{student.name}</strong>
                        {isRecent && (
                          <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                            Just Added
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {student.gradeLevel || 'Class 1'} • Section {student.section || 'A'} • Roll {student.rollNumber || '01'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {student.preferredLanguage || 'Santhali'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle2 size={13} /> Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setStudentToDelete(student)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={`Remove ${student.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
