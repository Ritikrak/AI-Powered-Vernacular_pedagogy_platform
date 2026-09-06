import { useEffect, useState } from 'react'
import { Bookmark, ChevronRight, Globe2, Headphones, Play, Sparkles, Star, Volume2, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { lessonApi, translationApi, type Lesson } from './api'
import { useApp } from './context'

export default function StudentLearningPage() {
  const { preferredLanguage, setPreferredLanguage, toast } = useApp()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vernacular-saved-chapters') || '[]')
    } catch {
      return []
    }
  })

  // Selected lesson modal
  const [readingLesson, setReadingLesson] = useState<Lesson | null>(null)
  const [translatedText, setTranslatedText] = useState('')
  const [phoneticText, setPhoneticText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await lessonApi.list()
        setLessons(data)
      } catch {
        toast('Could not fetch curriculum lessons', 'info')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleSaved = (id: string | number) => {
    const key = String(id)
    const next = saved.includes(key) ? saved.filter(item => item !== key) : [...saved, key]
    setSaved(next)
    localStorage.setItem('vernacular-saved-chapters', JSON.stringify(next))
    toast(saved.includes(key) ? 'Lesson removed from saved list' : 'Lesson saved for revision', 'success')
  }

  const handleOpenLesson = async (lesson: Lesson) => {
    setReadingLesson(lesson)
    setIsTranslating(true)
    try {
      const textToTranslate = lesson.simplified_text || lesson.simplifiedText || lesson.source_text
      const res = await translationApi.translateSingle(textToTranslate, preferredLanguage, 'Hindi')
      setTranslatedText(res.translated_text)
      setPhoneticText(res.phonetic_text || '')
    } catch {
      setTranslatedText(lesson.simplified_text || lesson.simplifiedText || lesson.source_text)
      setPhoneticText('')
    } finally {
      setIsTranslating(false)
    }
  }

  const playSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <section className="page-card student-learning">
      {/* Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">STUDENT MULTILINGUAL DESK</span>
          <h1>My Learning Journey</h1>
          <p>Read curriculum chapters in your mother tongue, listen to audio lessons, and revise saved topics.</p>
        </div>

        {/* Dialect Selector */}
        <div className="flex items-center gap-3 bg-indigo-50/70 border border-indigo-100 px-4 py-2 rounded-2xl">
          <Globe2 size={18} className="text-indigo-600" />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Learn in Mother Tongue</span>
            <select
              value={preferredLanguage}
              onChange={e => {
                setPreferredLanguage(e.target.value)
                toast(`Learning language set to ${e.target.value}`, 'info')
              }}
              className="bg-transparent text-xs font-bold text-indigo-950 focus:outline-none cursor-pointer"
            >
              <option value="Santhali">Santhali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
              <option value="Mundari">Mundari (ᱢᱩᱱᱰᱟᱨᱤ)</option>
              <option value="Ho">Ho (ᱦᱳ)</option>
              <option value="Kurukh">Kurukh (कुड़ुख़)</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Classroom Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 my-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-800/80 flex items-center justify-center text-white">
            <Radio size={22} className="text-emerald-400 animate-pulse" />
          </div>
          <div>
            <strong className="text-base block">Live Classroom is Active</strong>
            <span className="text-xs text-indigo-200">
              Join Room 01 to receive real-time speech translations from your teacher.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/live-classroom')}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
        >
          Join Live Classroom →
        </button>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-2xl font-bold font-mono text-indigo-600 block">{lessons.length}</span>
          <span className="text-xs text-slate-500">Curriculum Lessons Available</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-2xl font-bold font-mono text-emerald-600 block">{saved.length}</span>
          <span className="text-xs text-slate-500">Saved for Offline Study</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-2xl font-bold font-mono text-amber-600 block">{preferredLanguage}</span>
          <span className="text-xs text-slate-500">Active Mother Tongue Dialect</span>
        </div>
      </div>

      {/* Chapters Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <strong className="text-sm font-bold text-slate-800">
            Curriculum Chapters ({lessons.length})
          </strong>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading lessons...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {lessons.map(lesson => {
              const isSaved = saved.includes(String(lesson.id || lesson._id))
              return (
                <article
                  key={lesson.id || lesson._id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {lesson.subject}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSaved(lesson.id || lesson._id || '')}
                        className={`p-1 rounded text-slate-400 hover:text-amber-500 ${isSaved ? 'text-amber-500' : ''}`}
                        title={isSaved ? 'Remove from saved' : 'Save for offline'}
                      >
                        <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1">
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {lesson.simplified_text || lesson.simplifiedText || lesson.source_text}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {lesson.grade_level || lesson.gradeLevel || 'Class 5'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenLesson(lesson)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Read in {preferredLanguage} <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* READING MODAL IN VERNACULAR */}
      {readingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  {preferredLanguage} Edition • {readingLesson.subject}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{readingLesson.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setReadingLesson(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Mother tongue translation text */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-indigo-900">
                  {preferredLanguage} Translation
                </span>
                <button
                  type="button"
                  onClick={() => playSpeech(translatedText)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
                >
                  <Volume2 size={15} /> Listen Audio
                </button>
              </div>

              {isTranslating ? (
                <div className="py-6 text-center text-xs text-indigo-600 animate-pulse">
                  Translating into {preferredLanguage}...
                </div>
              ) : (
                <>
                  <p className="text-base font-bold text-indigo-950 leading-relaxed font-sans">
                    {translatedText}
                  </p>
                  {phoneticText && (
                    <p className="mt-3 text-xs text-indigo-600 font-mono italic">
                      Phonetic: &ldquo;{phoneticText}&rdquo;
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Hindi Source */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed mb-4">
              <strong className="block text-slate-900 mb-1">Hindi Source:</strong>
              {readingLesson.simplified_text || readingLesson.simplifiedText || readingLesson.source_text}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReadingLesson(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}