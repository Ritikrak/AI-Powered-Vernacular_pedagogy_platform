import { ChangeEvent, useEffect, useState } from 'react'
import { BookOpen, Check, FilePlus2, Library, Radio, Upload, Users, Sparkles, ChevronRight, Languages } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { classroomApi, lessonApi, type Lesson, type RoomState } from './api'
import { useApp } from './context'

export default function TeacherPanelPage() {
  const { toast } = useApp()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [uploadedName, setUploadedName] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedLessons, fetchedRoom] = await Promise.all([
          lessonApi.list().catch(() => []),
          classroomApi.getRoomDetails('main').catch(() => null)
        ])
        setLessons(fetchedLessons)
        setRoomState(fetchedRoom)
      } catch (err) {
        console.warn(err)
      }
    }
    loadData()
  }, [])

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('subject', 'General Science')
      form.append('gradeLevel', 'Class 5')
      const created = await lessonApi.upload(form)
      setUploadedName(created.title || file.name)
      toast(`"${file.name}" uploaded & AI-simplified for classroom teaching!`, 'success')
      const updated = await lessonApi.list()
      setLessons(updated)
    } catch {
      toast('Failed to process lesson document', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="page-card teacher-panel">
      {/* Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">TEACHER PEDAGOGY STUDIO</span>
          <h1>Teaching Command Center</h1>
          <p>Prepare lessons, extract curriculum content, and bring live vernacular translation to your students.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/live-classroom')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
        >
          <Radio size={16} /> Enter Live Classroom
        </button>
      </div>

      {/* Main Studio Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
        {/* Upload Card */}
        <label className="border border-slate-200 hover:border-indigo-400 bg-white rounded-2xl p-6 shadow-sm cursor-pointer transition-all flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={22} />
            </div>
            <strong className="text-base font-bold text-slate-900 block mb-1">
              Upload Lesson Document
            </strong>
            <span className="text-xs text-slate-500 block leading-relaxed">
              PDF or TXT documents. Backend will extract text & simplify it with Gemini AI.
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
            <span>{isUploading ? 'Extracting text...' : 'Select Document'}</span>
            <ChevronRight size={15} />
          </div>

          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        {/* Content Library */}
        <button
          type="button"
          onClick={() => navigate('/lessons')}
          className="border border-slate-200 hover:border-indigo-400 bg-white rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between text-left group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Library size={22} />
            </div>
            <strong className="text-base font-bold text-slate-900 block mb-1">
              Curriculum Repository
            </strong>
            <span className="text-xs text-slate-500 block leading-relaxed">
              Browse {lessons.length} saved chapters with on-demand vernacular translations.
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>View All Lessons</span>
            <ChevronRight size={15} />
          </div>
        </button>

        {/* Translation Studio */}
        <button
          type="button"
          onClick={() => navigate('/live-session')}
          className="border border-slate-200 hover:border-indigo-400 bg-white rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between text-left group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Languages size={22} />
            </div>
            <strong className="text-base font-bold text-slate-900 block mb-1">
              Multilingual Translator
            </strong>
            <span className="text-xs text-slate-500 block leading-relaxed">
              Quickly test classroom phrases in Santhali, Mundari, Ho, and Kurukh.
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
            <span>Open Studio</span>
            <ChevronRight size={15} />
          </div>
        </button>
      </div>

      {uploadedName && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-6">
          <Check size={16} className="text-emerald-600" />
          Lesson &ldquo;{uploadedName}&rdquo; is parsed and added to your curriculum catalog!
        </div>
      )}

      {/* Classroom Status Banner */}
      <div className="bg-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-800/80 flex items-center justify-center text-white">
            <Users size={22} />
          </div>
          <div>
            <strong className="text-base block">Classroom Room 01 Status</strong>
            <span className="text-xs text-indigo-200">
              {roomState?.studentCount || 0} students connected • Real-time Socket.IO pipeline ready
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/live-classroom')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
        >
          Start Speech Broadcast
        </button>
      </div>

      {/* Recent Curriculum Lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="eyebrow">CURRICULUM LESSONS</span>
            <h2 className="text-lg font-bold text-slate-900">Active Lessons</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/lessons')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            See all ({lessons.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lessons.slice(0, 3).map(lesson => (
            <article
              key={lesson.id || lesson._id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                  <span className="font-semibold uppercase text-indigo-600">{lesson.subject}</span>
                  <span>{lesson.grade_level || lesson.gradeLevel || 'Class 5'}</span>
                </div>
                <strong className="text-sm font-bold text-slate-900 block mb-2 line-clamp-1">
                  {lesson.title}
                </strong>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {lesson.simplified_text || lesson.simplifiedText || lesson.source_text}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <Sparkles size={12} /> AI Ready
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/translated-lessons')}
                  className="hover:underline"
                >
                  View Translations →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}