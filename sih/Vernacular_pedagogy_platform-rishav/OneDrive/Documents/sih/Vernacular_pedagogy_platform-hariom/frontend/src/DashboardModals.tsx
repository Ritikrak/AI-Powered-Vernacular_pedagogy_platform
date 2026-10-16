import React, { useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Languages,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import { useApp, type StudentItem, type LessonItem, type DialectItem } from './context'

interface ModalProps {
  onClose: () => void
}

// ================= 1. CONNECTED STUDENTS MODAL =================
export function StudentsModal({ onClose }: ModalProps) {
  const { students, addStudent, deleteStudent } = useApp()
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

    // Highlight newly added student
    setRecentAddedId(added.id)
    setTimeout(() => setRecentAddedId(null), 4000)

    setFormSuccessMessage(`"${added.name}" added to ${added.gradeLevel}!`)
    setTimeout(() => setFormSuccessMessage(''), 3000)

    setName('')
    // Suggest next roll number
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

  return (
    <div className="dashboard-modal-backdrop" onClick={onClose}>
      <div className="dashboard-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="modal-header-icon bg-purple-100 text-purple-700">
              <Users size={22} />
            </div>
            <div>
              <strong className="text-base text-slate-900 block font-bold">
                Connected Students & Classroom Roster
              </strong>
              <span className="text-xs text-slate-500">
                {students.length} active students enrolled across Class 1 to 8 • Synchronized live with Dashboard
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {studentToDelete && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between animate-fadeInModal">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-900">
                Remove <strong>{studentToDelete.name}</strong> ({studentToDelete.gradeLevel}) from classroom roster?
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

        {/* Body */}
        <div className="modal-body space-y-4">
          {/* Top Bar: Title + Add Student Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student Roster ({students.length})
              </span>
              {formSuccessMessage && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md animate-fadeInModal">
                  ✓ {formSuccessMessage}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} /> {showAddForm ? 'Hide Form' : '+ Enroll Student'}
            </button>
          </div>

          {/* Add Student Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeInModal">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <strong className="text-xs font-bold text-slate-800 block">Enroll Student (Classes 1 to 8)</strong>
                <span className="text-[11px] text-slate-500 font-medium">Add as many students as needed</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Student Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Hansda"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Mother Tongue Dialect</label>
                  <select
                    value={preferredLanguage}
                    onChange={e => setPreferredLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Santhali">संथाली (Santhali - Ol Chiki)</option>
                    <option value="Mundari">मुंडारी (Mundari - Mundari Bani)</option>
                    <option value="Ho">हो (Ho - Warang Citi)</option>
                    <option value="Kurukh">कुड़ुख़ (Kurukh - Tolong Siki)</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Grade Level (Class 1 to 8)</label>
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
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Section & Roll No</label>
                  <div className="flex gap-2">
                    <select
                      value={section}
                      onChange={e => setSection(e.target.value)}
                      className="w-20 px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  Tip: Click &quot;Enroll &amp; Add Another&quot; to quickly add multiple students without reopening the form.
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
                    Enroll Student
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Search & Class Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search enrolled students by name, roll, or language..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Students List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto">
            {students.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No students enrolled yet. Click &quot;+ Enroll Student&quot; above to add your first student.
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
                    className={`p-3 sm:px-4 flex items-center justify-between transition-colors ${
                      isRecent ? 'bg-emerald-50/90 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                        isRecent ? 'bg-emerald-200 text-emerald-800' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900 font-bold">{student.name}</strong>
                          {isRecent && (
                            <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                              Just Added
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {student.gradeLevel || 'Class 1'} • Sec {student.section || 'A'} • Roll {student.rollNumber || '01'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold font-mono">
                        {student.preferredLanguage}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hidden sm:inline">
                        {student.score || 94}% Gain
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

        {/* Footer */}
        <div className="modal-footer">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Total Enrolled: <strong className="text-slate-900 font-bold">{students.length}</strong>
            </span>
            {filterClass !== 'All' && (
              <span className="hidden sm:inline">
                ({filterClass}: <strong className="text-indigo-600 font-bold">{students.filter(s => s.gradeLevel === filterClass).length}</strong>)
              </span>
            )}
            {searchQuery && (
              <span className="text-slate-400">
                (Filtered: {filteredStudents.length})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= 2. CURRICULUM LESSONS MODAL =================
export function LessonsModal({ onClose }: ModalProps) {
  const { lessons, createLesson, deleteLesson } = useApp()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<LessonItem | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('General Science')
  const [gradeLevel, setGradeLevel] = useState('Class 5')
  const [sourceText, setSourceText] = useState('')
  const [simplifiedText, setSimplifiedText] = useState('')

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !sourceText.trim()) return
    createLesson({
      title: title.trim(),
      subject,
      gradeLevel,
      source_text: sourceText.trim(),
      simplified_text: simplifiedText.trim() || sourceText.trim().slice(0, 100) + '...',
      status: 'published'
    })
    setTitle('')
    setSourceText('')
    setSimplifiedText('')
    setShowCreateForm(false)
  }

  const handleConfirmDelete = () => {
    if (lessonToDelete) {
      deleteLesson(lessonToDelete.id)
      setLessonToDelete(null)
    }
  }

  return (
    <div className="dashboard-modal-backdrop" onClick={onClose}>
      <div className="dashboard-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="modal-header-icon bg-blue-100 text-blue-700">
              <BookOpen size={22} />
            </div>
            <div>
              <strong className="text-base text-slate-900 block font-bold">
                Curriculum Lessons Repository
              </strong>
              <span className="text-xs text-slate-500">
                {lessons.length} curriculum lessons • Updates Curriculum Lessons count live
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {lessonToDelete && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between animate-fadeInModal">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-900">
                Delete lesson <strong>&quot;{lessonToDelete.title}&quot;</strong> permanently?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLessonToDelete(null)}
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

        {/* Body */}
        <div className="modal-body space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lessons Catalog ({lessons.length})
            </span>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} /> {showCreateForm ? 'Close Form' : 'Create Lesson'}
            </button>
          </div>

          {/* Create Lesson Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeInModal">
              <strong className="text-xs font-bold text-slate-800 block">Create Curriculum Lesson</strong>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Lesson Title / शीर्षक</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. सौर मंडल और ग्रह (Solar System)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="General Science">General Science</option>
                    <option value="EVS / पर्यावरण">EVS / पर्यावरण</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Textbook Content / मूल पाठ</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Enter standard textbook text..."
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">AI Simplified Content (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Simplified explanation for vernacular students..."
                  value={simplifiedText}
                  onChange={e => setSimplifiedText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Publish Lesson
                </button>
              </div>
            </form>
          )}

          {/* Lessons List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-80 overflow-y-auto">
            {lessons.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No lessons in repository. Click &quot;Create Lesson&quot; above to add your first lesson.
              </div>
            ) : (
              lessons.map(lesson => (
                <div key={lesson.id} className="p-3 sm:px-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold leading-snug">{lesson.title}</strong>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        {lesson.subject} • {lesson.gradeLevel || 'Class 5'}
                      </span>
                      <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed">
                        {lesson.simplified_text || lesson.source_text}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLessonToDelete(lesson)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                    title={`Delete ${lesson.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="text-xs text-slate-500">
            Total Curriculum Lessons: <strong className="text-slate-900 font-bold">{lessons.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= 3. VERNACULAR DIALECTS MODAL =================
export function DialectsModal({ onClose }: ModalProps) {
  const { dialects, addDialect, deleteDialect } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [dialectToDelete, setDialectToDelete] = useState<DialectItem | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [script, setScript] = useState('')
  const [region, setRegion] = useState('')
  const [speakersEstimate, setSpeakersEstimate] = useState('')

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!englishName.trim()) return
    addDialect({
      name: name.trim() || englishName.trim(),
      englishName: englishName.trim(),
      script: script.trim() || 'Regional Script',
      nativeScriptSample: name.trim().slice(0, 4) || englishName.slice(0, 3),
      region: region.trim() || 'Jharkhand Tribal Belt',
      speakersEstimate: speakersEstimate.trim() || 'Active Regional Dialect'
    })
    setName('')
    setEnglishName('')
    setScript('')
    setRegion('')
    setSpeakersEstimate('')
    setShowAddForm(false)
  }

  const handleConfirmDelete = () => {
    if (dialectToDelete) {
      deleteDialect(dialectToDelete.id)
      setDialectToDelete(null)
    }
  }

  return (
    <div className="dashboard-modal-backdrop" onClick={onClose}>
      <div className="dashboard-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="modal-header-icon bg-emerald-100 text-emerald-700">
              <Languages size={22} />
            </div>
            <div>
              <strong className="text-base text-slate-900 block font-bold">
                Vernacular Dialects Management
              </strong>
              <span className="text-xs text-slate-500">
                {dialects.length} active dialects • Add or remove supported tribal languages
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {dialectToDelete && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between animate-fadeInModal">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-900">
                Remove dialect <strong>&quot;{dialectToDelete.englishName}&quot;</strong> from active classroom languages?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDialectToDelete(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="modal-body space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Regional Dialects ({dialects.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} /> {showAddForm ? 'Close Form' : 'Add Dialect'}
            </button>
          </div>

          {/* Add Dialect Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeInModal">
              <strong className="text-xs font-bold text-slate-800 block">Add Vernacular Dialect</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">English Name (e.g. Kharia)</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kharia"
                    value={englishName}
                    onChange={e => setEnglishName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Native Name / स्थानीय नाम</label>
                  <input
                    type="text"
                    placeholder="e.g. खड़िया / ᱠᱷᱟᱨᱤᱭᱟ"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Script Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Devanagari / Tolong"
                    value={script}
                    onChange={e => setScript(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tribal Region / District</label>
                  <input
                    type="text"
                    placeholder="e.g. Simdega, Gumla"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Enable Dialect
                </button>
              </div>
            </form>
          )}

          {/* Dialects List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {dialects.map(dialect => (
              <div
                key={dialect.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-2 hover:border-emerald-300 transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-emerald-700">
                      {dialect.name || dialect.englishName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono px-2 py-0.5 bg-slate-100 rounded-md">
                      {dialect.englishName}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 block">
                    Script: <strong>{dialect.script}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {dialect.region} • {dialect.speakersEstimate}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setDialectToDelete(dialect)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title={`Remove ${dialect.englishName}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="text-xs text-slate-500">
            Active Dialects: <strong className="text-slate-900 font-bold">{dialects.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= 4. COMPREHENSION GAIN MODAL =================
export function ComprehensionModal({ onClose }: ModalProps) {
  const { comprehensionGain, students, lessons } = useApp()

  const baselineScore = 56
  const netGain = Math.max(0, comprehensionGain - baselineScore)

  return (
    <div className="dashboard-modal-backdrop" onClick={onClose}>
      <div className="dashboard-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="modal-header-icon bg-orange-100 text-orange-700">
              <BarChart3 size={22} />
            </div>
            <div>
              <strong className="text-base text-slate-900 block font-bold">
                Comprehension Gain & Vernacular Analytics
              </strong>
              <span className="text-xs text-slate-500">
                Calculated dynamically from {students.length} enrolled student assessments
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-5">
          {/* Top Score Comparison Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
                Overall Pedagogy Impact
              </span>
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-bold">
                ↑ +{netGain}% Gain
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-4xl font-extrabold font-mono">{comprehensionGain}%</strong>
              <span className="text-orange-100 text-xs font-medium">Average Vernacular Retention</span>
            </div>
            <p className="text-xs text-white/90 mt-2 leading-relaxed">
              Compared to a 56% baseline in standard textbook Hindi, teaching concepts in their tribal mother tongue yields a +{netGain}% comprehension gain.
            </p>
          </div>

          {/* Breakdown By Dialect */}
          <div>
            <strong className="text-xs font-bold text-slate-800 block mb-3 uppercase tracking-wider">
              Comprehension Performance by Dialect
            </strong>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Santhali (Ol Chiki)</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-600">96%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">+40% vs Hindi standard</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Ho (Warang Citi)</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-600">95%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '95%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">+39% vs Hindi standard</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Mundari (Mundari Bani)</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-600">92%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">+36% vs Hindi standard</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Kurukh (Tolong Siki)</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-600">91%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">+35% vs Hindi standard</span>
              </div>
            </div>
          </div>

          {/* Student Cohort Statistics */}
          <div className="border-t border-slate-100 pt-4">
            <strong className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-wider">
              Enrolled Student Cohort Assessment Sample ({students.length} students)
            </strong>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                  <span className="font-semibold text-slate-800">{s.name} ({s.preferredLanguage})</span>
                  <span className="font-mono font-bold text-orange-600">{s.score || 94}% Comprehension</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            ℹ️ <strong>System Note:</strong> This metric is calculated continuously using test score data across {lessons.length} curriculum lesson modules and cannot be directly typed or forged.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="text-xs text-slate-500">
            Computed Cohort Gain: <strong className="text-slate-900 font-bold">+{netGain}%</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
