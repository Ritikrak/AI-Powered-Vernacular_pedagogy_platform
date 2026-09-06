import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Plus,
  Radio,
  RefreshCw,
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

  // Form states
  const [name, setName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('Santhali')
  const [gradeLevel, setGradeLevel] = useState('Class 5')
  const [section, setSection] = useState('A')
  const [rollNumber, setRollNumber] = useState('')

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addStudent({
      name: name.trim(),
      preferredLanguage,
      gradeLevel,
      section,
      rollNumber: rollNumber.trim() || `0${students.length + 1}`,
      score: Math.floor(Math.random() * 7 + 92),
      attendanceStatus: 'active'
    })
    setName('')
    setRollNumber('')
    setShowAddForm(false)
  }

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id)
      setStudentToDelete(null)
    }
  }

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
          <p>Monitor student attendance, active vernacular preferences, and classroom participation.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus size={15} /> Enroll Student
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
              Are you sure you want to remove student <strong>&quot;{studentToDelete.name}&quot;</strong>? This will decrement the connected students count.
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
            <strong className="text-xs font-bold text-slate-900">Enroll New Student</strong>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={15} />
            </button>
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Mother Tongue *</label>
              <select
                value={preferredLanguage}
                onChange={e => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Santhali">संताली (Santhali)</option>
                <option value="Mundari">मुंडारी (Mundari)</option>
                <option value="Ho">हो (Ho)</option>
                <option value="Kurukh">कुड़ुख़ (Kurukh)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Class / Grade</label>
              <select
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 6">Class 6</option>
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
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              Save Student
            </button>
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
              Teacher: {roomState?.teacherName || (role === 'teacher' ? userName : '') || 'Classroom Teacher'} • {students.length} Enrolled Students
            </span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <strong className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Student Attendance Roster
          </strong>
          <span className="text-xs text-slate-400">{students.length} Students</span>
        </div>

        <div className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students enrolled yet. Click &quot;Enroll Student&quot; above.
            </div>
          ) : (
            students.map(student => (
              <div key={student.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 block">{student.name}</strong>
                    <span className="text-[10px] text-slate-400">
                      {student.gradeLevel || 'Class 5'} • Section {student.section || 'A'} • Roll {student.rollNumber || '01'}
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
            ))
          )}
        </div>
      </div>
    </section>
  )
}
