import { useEffect, useState } from 'react'
import { BookOpen, FileText, Plus, Search, Sparkles, Upload, Volume2, Globe, Check, Eye, ChevronRight, X } from 'lucide-react'
import { lessonApi, playVernacularAudio, type Lesson } from './api'
import { useApp } from './context'
import { CURRICULUM_STORIES } from './curriculumStories'

export default function LessonsPage() {
  const { role, toast } = useApp()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')

  // Upload/Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonSubject, setLessonSubject] = useState('Moral Stories / बाल साहित्य')
  const [lessonGrade, setLessonGrade] = useState('Class 3')
  const [lessonSourceText, setLessonSourceText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lesson Detail View
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [translatingLang, setTranslatingLang] = useState<string | null>(null)
  const [activeTranslation, setActiveTranslation] = useState<{
    language: string
    translated_text: string
    phonetic_text?: string
  } | null>(null)
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null)

  const loadLessons = async () => {
    setLoading(true)
    try {
      const data = await lessonApi.list()
      const combined = data && data.length > 0 ? data : CURRICULUM_STORIES
      setLessons(combined)
    } catch {
      setLessons(CURRICULUM_STORIES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLessons()
  }, [])

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (uploadFile) {
        const form = new FormData()
        form.append('file', uploadFile)
        if (lessonTitle) form.append('title', lessonTitle)
        form.append('subject', lessonSubject)
        form.append('gradeLevel', lessonGrade)
        await lessonApi.upload(form)
      } else {
        if (!lessonSourceText.trim()) {
          toast('Please provide either a lesson file (PDF/TXT) or source text', 'error')
          setIsSubmitting(false)
          return
        }
        await lessonApi.createManual({
          title: lessonTitle || 'Untitled Lesson',
          subject: lessonSubject,
          gradeLevel: lessonGrade,
          sourceText: lessonSourceText
        })
      }

      toast('Lesson successfully created and AI-simplified!', 'success')
      setShowCreateModal(false)
      setUploadFile(null)
      setLessonTitle('')
      setLessonSourceText('')
      await loadLessons()
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to create lesson', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTranslateLesson = async (lessonId: string | number, targetLang: string) => {
    setTranslatingLang(targetLang)
    try {
      // 1. Direct check in activeLesson.translations
      if (activeLesson && activeLesson.translations && activeLesson.translations.length > 0) {
        const found = activeLesson.translations.find(
          t => t.language.toLowerCase() === targetLang.toLowerCase()
        )
        if (found) {
          setActiveTranslation({
            language: targetLang,
            translated_text: found.translated_text,
            phonetic_text: found.phonetic_text
          })
          toast(`Lesson translated into ${targetLang}!`, 'success')
          setTranslatingLang(null)
          return
        }
      }

      // 2. Fallback check in CURRICULUM_STORIES
      const matched = CURRICULUM_STORIES.find(
        s => String(s.id) === String(lessonId) || (activeLesson && s.title.toLowerCase() === activeLesson.title.toLowerCase())
      )
      if (matched && matched.translations) {
        const found = matched.translations.find(
          t => t.language.toLowerCase() === targetLang.toLowerCase()
        )
        if (found) {
          setActiveTranslation({
            language: targetLang,
            translated_text: found.translated_text,
            phonetic_text: found.phonetic_text
          })
          toast(`Lesson translated into ${targetLang}!`, 'success')
          setTranslatingLang(null)
          return
        }
      }

      const res = await lessonApi.translateLesson(lessonId, targetLang)
      setActiveTranslation({
        language: targetLang,
        translated_text: res.translated_text,
        phonetic_text: res.phonetic_text
      })
      toast(`Lesson translated into ${targetLang}!`, 'success')
      await loadLessons()
    } catch {
      toast(`Failed to translate into ${targetLang}`, 'error')
    } finally {
      setTranslatingLang(null)
    }
  }

  const playSpeech = (text: string, language = 'Hindi', phonetic = '', key = '') => {
    if (key) setPlayingAudioKey(key)
    playVernacularAudio({
      text,
      language,
      phonetic: phonetic || text,
      onStart: () => {
        if (key) setPlayingAudioKey(key)
      },
      onEnd: () => {
        setPlayingAudioKey(null)
      },
      onError: () => {
        setPlayingAudioKey(null)
      }
    })
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.source_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === 'All' || lesson.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  return (
    <section className="page-card lessons-page">
      {/* Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">CURRICULUM & VERNACULAR REPOSITORY</span>
          <h1>Lesson Catalog</h1>
          <p>Explore, simplify, and translate classroom lessons into Santhali, Mundari, Ho, and Kurukh.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> Create / Upload Lesson
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 my-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search lessons by title, subject, or content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Subjects ({lessons.length})</option>
          <option value="Moral Stories / बाल साहित्य">📖 Moral Stories / बाल साहित्य</option>
          <option value="Science">Science</option>
          <option value="General Science">General Science</option>
          <option value="EVS">EVS / पर्यावरण</option>
          <option value="Social Studies">Social Studies / इतिहास</option>
        </select>
      </div>

      {/* Lesson Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading lessons from curriculum engine...</div>
      ) : filteredLessons.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8">
          <FileText size={36} className="mx-auto text-slate-300 mb-2" />
          <strong className="text-slate-700 text-sm block">No lessons found</strong>
          <span className="text-slate-400 text-xs">Create your first lesson or upload a PDF to get started.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map(lesson => (
            <article
              key={lesson.id || lesson._id}
              className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                    {lesson.subject || 'Science'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {lesson.grade_level || lesson.gradeLevel || 'Class 5'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1">
                  {lesson.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {lesson.simplified_text || lesson.simplifiedText || lesson.source_text}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <Sparkles size={13} className="text-emerald-500" />
                  <span>AI Simplified</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveLesson(lesson)
                    setActiveTranslation(null)
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Explore & Translate <ChevronRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CREATE / UPLOAD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <strong className="text-base text-slate-900 block">Upload or Create Lesson</strong>
                <span className="text-xs text-slate-500">
                  Backend will extract text and automatically simplify it for primary classrooms.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Upload File (PDF / TXT)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50">
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-lesson-upload"
                  />
                  <label htmlFor="file-lesson-upload" className="cursor-pointer">
                    <Upload size={24} className="mx-auto text-indigo-600 mb-2" />
                    <span className="text-xs text-slate-700 font-semibold block">
                      {uploadFile ? uploadFile.name : 'Click to choose PDF or text document'}
                    </span>
                    <span className="text-[10px] text-slate-400">PDF text extraction handled automatically</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lesson Title</label>
                <input
                  type="text"
                  placeholder="e.g. The Water Cycle (जल चक्र)"
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={lessonSubject}
                    onChange={e => setLessonSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>General Science</option>
                    <option>EVS</option>
                    <option>Social Studies</option>
                    <option>Language & Literature</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Grade Level</label>
                  <select
                    value={lessonGrade}
                    onChange={e => setLessonGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Class 1</option>
                    <option>Class 2</option>
                    <option>Class 3</option>
                    <option>Class 4</option>
                    <option>Class 5</option>
                    <option>Class 6</option>
                    <option>Class 7</option>
                    <option>Class 8</option>
                  </select>
                </div>
              </div>

              {!uploadFile && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Source Text (Hindi)</label>
                  <textarea
                    rows={4}
                    placeholder="Enter lesson text to simplify and translate..."
                    value={lessonSourceText}
                    onChange={e => setLessonSourceText(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {isSubmitting ? 'Processing AI...' : 'Save & Simplify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LESSON DETAIL & VERNACULAR TRANSLATION DRAWER */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  {activeLesson.subject} • {activeLesson.grade_level || activeLesson.gradeLevel || 'Class 5'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{activeLesson.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveLesson(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Original vs Simplified tabs */}
            <div className="space-y-4 my-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Original Source Lesson (Hindi)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{activeLesson.source_text}</p>
              </div>

              {(activeLesson.simplified_text || activeLesson.simplifiedText) && (
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={13} /> Gemini AI Simplified for Students
                    </span>
                    <button
                      type="button"
                      onClick={() => playSpeech(activeLesson.simplified_text || activeLesson.simplifiedText || '', 'Hindi', '', 'hindi-simplified')}
                      className={`text-xs flex items-center gap-1 font-semibold px-2 py-1 rounded transition-colors ${
                        playingAudioKey === 'hindi-simplified'
                          ? 'text-emerald-950 bg-emerald-200 animate-pulse'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      <Volume2 size={13} className={playingAudioKey === 'hindi-simplified' ? 'animate-bounce' : ''} />
                      {playingAudioKey === 'hindi-simplified' ? 'Reading...' : 'Read Aloud'}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {activeLesson.simplified_text || activeLesson.simplifiedText}
                  </p>
                </div>
              )}

              {/* Translate into Vernacular Languages */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-900 block mb-2">
                  Translate into Regional Vernaculars
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Santhali', 'Mundari', 'Ho', 'Kurukh', 'English'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      disabled={translatingLang === lang}
                      onClick={() => handleTranslateLesson(activeLesson.id || activeLesson._id || '', lang)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        activeTranslation?.language === lang
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Globe size={13} />
                      {translatingLang === lang ? `Translating ${lang}...` : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Translation Output */}
              {activeTranslation && (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-indigo-900 uppercase tracking-wider">
                      {activeTranslation.language} Vernacular Output
                    </strong>
                    <button
                      type="button"
                      onClick={() => playSpeech(activeTranslation.translated_text, activeTranslation.language, activeTranslation.phonetic_text, 'vernacular-output')}
                      className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                        playingAudioKey === 'vernacular-output'
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'text-indigo-700 hover:text-indigo-900 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <Volume2 size={14} className={playingAudioKey === 'vernacular-output' ? 'animate-bounce' : ''} />
                      {playingAudioKey === 'vernacular-output' ? 'Playing...' : 'Listen Pronunciation'}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-indigo-950 leading-relaxed">
                    {activeTranslation.translated_text}
                  </p>
                  {activeTranslation.phonetic_text && (
                    <p className="text-xs text-indigo-600 mt-2 font-mono italic">
                      Pronunciation: &ldquo;{activeTranslation.phonetic_text}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveLesson(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
