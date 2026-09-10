import { useEffect, useRef, useState } from 'react'
import { Bookmark, ChevronRight, Globe2, Headphones, Play, Pause, Sparkles, Star, Volume2, VolumeX, Radio, Search, CheckCircle2, Clock, BookOpen, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { lessonApi, translationApi, progressApi, studentApi, classroomApi, playVernacularAudio, type Lesson, type ProgressSummary, type LessonAudioResponse } from './api'
import { useApp } from './context'
import { CURRICULUM_STORIES } from './curriculumStories'

export default function StudentLearningPage() {
  const { preferredLanguage, setPreferredLanguage, toast } = useApp()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [saved, setSaved] = useState<string[]>([])
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    total: 15,
    completed: 8,
    inProgress: 3,
    notStarted: 4
  })

  // Selected lesson modal
  const [readingLesson, setReadingLesson] = useState<Lesson | null>(null)
  const [activeModalLang, setActiveModalLang] = useState<string>(preferredLanguage)
  const [translatedText, setTranslatedText] = useState('')
  const [phoneticText, setPhoneticText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Audio player state
  const [audioData, setAudioData] = useState<LessonAudioResponse | null>(null)
  const [audioLanguage, setAudioLanguage] = useState<string>(preferredLanguage)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load lessons, saved list, and progress metrics from backend
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [lessonsData, savedData, progData] = await Promise.all([
          lessonApi.list().catch(() => CURRICULUM_STORIES),
          studentApi.getSaved().catch(() => ({ total: 0, savedLessons: [] })),
          progressApi.getSummary().catch(() => ({ total: 15, completed: 8, inProgress: 3, notStarted: 4 }))
        ])

        const combined = lessonsData && lessonsData.length > 0 ? lessonsData : CURRICULUM_STORIES
        setLessons(combined)
        setSaved(savedData.savedLessons.map(String))
        setProgressSummary(progData)
      } catch (err) {
        setLessons(CURRICULUM_STORIES)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Audio element management
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.ontimeupdate = () => {
      if (audio.duration) {
        const currentProg = (audio.currentTime / audio.duration) * 100
        setAudioProgress(currentProg)
        setAudioDuration(audio.duration)

        // If listened past 75%, automatically record progress to backend
        if (currentProg > 75 && readingLesson) {
          progressApi.record(readingLesson.id || readingLesson._id || '', Math.round(currentProg)).catch(() => {})
        }
      }
    }

    audio.onended = () => {
      setIsPlaying(false)
      setAudioProgress(100)
      if (readingLesson) {
        lessonApi.complete(readingLesson.id || readingLesson._id || '').then(res => {
          if (res.summary) setProgressSummary(res.summary)
        }).catch(() => {})
      }
    }

    audio.onerror = () => {
      setIsPlaying(false)
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [readingLesson])

  const toggleSaved = async (id: string | number, title?: string) => {
    const key = String(id)
    const isCurrentlySaved = saved.includes(key)

    try {
      if (isCurrentlySaved) {
        const res = await studentApi.removeSaved(key)
        setSaved(res.savedLessons.map(String))
        toast('Lesson removed from saved for offline study', 'info')
      } else {
        const res = await studentApi.save(key, title || 'Curriculum Lesson')
        setSaved(res.savedLessons.map(String))
        toast('Lesson saved for offline study! Available anytime.', 'success')
      }
    } catch {
      // Fallback local toggle if offline
      const next = isCurrentlySaved ? saved.filter(item => item !== key) : [...saved, key]
      setSaved(next)
    }
  }

  const handleOpenLesson = async (lesson: Lesson, langOverride?: string) => {
    const targetLang = langOverride || preferredLanguage
    setActiveModalLang(targetLang)
    setReadingLesson(lesson)
    setAudioLanguage(targetLang)
    setIsPlaying(false)
    setAudioProgress(0)

    // Check if previously completed
    const matchRecord = progressSummary.records?.find(
      r => String(r.lessonId) === String(lesson.id) || String(r.lessonId) === String(lesson._id)
    )
    setIsCompleted(matchRecord?.status === 'completed')

    // 1. Track lesson progress on open (e.g. 75% reading progress)
    try {
      const progRes = await progressApi.record(lesson.id || lesson._id || '', 75)
      if (progRes.summary) {
        setProgressSummary(progRes.summary)
      }
    } catch {
      // Quiet fail
    }

    // 2. Fetch multi-language audio streams for this lesson
    try {
      const audioRes = await lessonApi.getAudio(lesson.id || lesson._id || '')
      setAudioData(audioRes)
    } catch {
      setAudioData(null)
    }

    // 3. Resolve textual translation
    if (targetLang === 'Hindi') {
      setTranslatedText(lesson.simplified_text || lesson.simplifiedText || lesson.source_text)
      setPhoneticText('')
      setIsTranslating(false)
      return
    }

    // Check pre-compiled translations
    if (lesson.translations && lesson.translations.length > 0) {
      const match = lesson.translations.find(
        t => t.language.toLowerCase() === targetLang.toLowerCase()
      )
      if (match) {
        setTranslatedText(match.translated_text)
        setPhoneticText(match.phonetic_text || '')
        setIsTranslating(false)
        return
      }
    }

    // Check in CURRICULUM_STORIES dataset
    const matchedStory = CURRICULUM_STORIES.find(
      s => String(s.id) === String(lesson.id || lesson._id) || s.title.toLowerCase() === lesson.title.toLowerCase()
    )
    if (matchedStory && matchedStory.translations) {
      const match = matchedStory.translations.find(
        t => t.language.toLowerCase() === targetLang.toLowerCase()
      )
      if (match) {
        setTranslatedText(match.translated_text)
        setPhoneticText(match.phonetic_text || '')
        setIsTranslating(false)
        return
      }
    }

    // Fallback to API translation
    setIsTranslating(true)
    try {
      const textToTranslate = lesson.simplified_text || lesson.simplifiedText || lesson.source_text
      const res = await translationApi.translateSingle(textToTranslate, targetLang, 'Hindi')
      setTranslatedText(res.translated_text)
      setPhoneticText(res.phonetic_text || '')
    } catch {
      setTranslatedText(lesson.simplified_text || lesson.simplifiedText || lesson.source_text)
      setPhoneticText('')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!readingLesson) return
    try {
      const res = await lessonApi.complete(readingLesson.id || readingLesson._id || '')
      setIsCompleted(true)
      if (res.summary) {
        setProgressSummary(res.summary)
      }
      toast('Congratulations! Lesson marked as completed 🎉', 'success')
    } catch {
      toast('Failed to mark lesson complete', 'error')
    }
  }

  const togglePlayAudio = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      playVernacularAudio({ text: '' })
      setIsPlaying(false)
    } else {
      const preloadedUrl = audioData?.audio?.[audioLanguage] || audioData?.audio?.Hindi || audioData?.audio?.English
      playVernacularAudio({
        text: translatedText,
        language: audioLanguage,
        phonetic: phoneticText || translatedText,
        audioUrl: preloadedUrl,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      })
    }
  }

  const playSpeechFallback = (text: string) => {
    playVernacularAudio({
      text,
      language: activeModalLang,
      phonetic: phoneticText || text,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false)
    })
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    setIsMuted(newVol === 0)
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
  }

  const handleSeek = (percentage: number) => {
    if (audioRef.current && audioDuration) {
      const newTime = (percentage / 100) * audioDuration
      audioRef.current.currentTime = newTime
      setAudioProgress(percentage)
    }
  }

  const filteredLessons = lessons.filter(l => {
    const matchSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.source_text && l.source_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.subject && l.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchCat =
      selectedCategory === 'All' ||
      (l.subject && l.subject.toLowerCase().includes(selectedCategory.toLowerCase()))
    return matchSearch && matchCat
  })

  return (
    <section className="page-card student-learning">
      {/* Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">STUDENT MULTILINGUAL DESK</span>
          <h1>My Learning Journey</h1>
          <p>Read curriculum chapters and moral stories in your mother tongue, listen to audio lessons, and revise saved topics.</p>
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
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
        >
          Join Live Classroom →
        </button>
      </div>

      {/* 4 Learning & Progress Metric Cards (Completed: 8, In Progress: 3, Saved: 0, Total: 15) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold font-mono text-indigo-600 block">{lessons.length || 15}</span>
            <BookOpen size={18} className="text-indigo-400" />
          </div>
          <span className="text-xs font-medium text-slate-600">Curriculum Lessons Available</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Grade 5 Science & Moral Studies</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 block">{progressSummary.completed}</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <span className="text-xs font-medium text-slate-600">Completed Lessons</span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Mastered concepts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold font-mono text-amber-600 block">{progressSummary.inProgress}</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <span className="text-xs font-medium text-slate-600">In Progress</span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Currently studying</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold font-mono text-purple-600 block">{saved.length}</span>
            <Bookmark size={18} className="text-purple-500" fill={saved.length > 0 ? 'currentColor' : 'none'} />
          </div>
          <span className="text-xs font-medium text-slate-600">Saved for Offline Study</span>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">Bookmarked chapters</span>
        </div>
      </div>

      {/* Search & Subject Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 my-6">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search lessons & stories (e.g. हिरन, शेर, मुर्गी, Water, Plants)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Moral Stories', 'Science', 'EVS', 'Social Studies'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'Moral Stories' ? '📖 कहानियाँ (Stories)' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <strong className="text-sm font-bold text-slate-800">
            Curriculum Chapters & Stories ({filteredLessons.length})
          </strong>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading curriculum lessons...</div>
        ) : filteredLessons.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed rounded-xl p-8">
            No matching lessons or stories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredLessons.map(lesson => {
              const isSaved = saved.includes(String(lesson.id)) || saved.includes(String(lesson._id))
              const matchRecord = progressSummary.records?.find(
                r => String(r.lessonId) === String(lesson.id) || String(r.lessonId) === String(lesson._id)
              )
              const status = matchRecord?.status || 'not_started'

              return (
                <article
                  key={lesson.id || lesson._id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {lesson.subject}
                        </span>
                        {status === 'completed' && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Completed
                          </span>
                        )}
                        {status === 'in_progress' && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Clock size={10} /> In Progress
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaved(lesson.id || lesson._id || '', lesson.title)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer ${
                          isSaved ? 'text-purple-600 bg-purple-50' : ''
                        }`}
                        title={isSaved ? 'Remove from saved offline study' : 'Save for offline study'}
                      >
                        <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mb-1.5 line-clamp-1">
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {lesson.description || lesson.simplified_text || lesson.simplifiedText || lesson.source_text}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Headphones size={13} className="text-indigo-500" />
                      <span>Audio Available</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenLesson(lesson)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
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

      {/* READING & AUDIO PLAYER MODAL */}
      {readingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {activeModalLang} Edition • Class 5 {readingLesson.subject}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{readingLesson.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause()
                  setIsPlaying(false)
                  setReadingLesson(null)
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* AUDIO LESSON PLAYER COMPONENT */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Headphones size={18} className="text-emerald-400" />
                  <span className="text-xs font-bold">Audio Lesson Player ({audioLanguage})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-300">Voice:</span>
                  <select
                    value={audioLanguage}
                    onChange={e => {
                      setAudioLanguage(e.target.value)
                      setIsPlaying(false)
                    }}
                    className="bg-slate-800 text-xs text-white border border-slate-700 px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Santhali">Santhali</option>
                    <option value="Mundari">Mundari</option>
                    <option value="Ho">Ho</option>
                    <option value="Kurukh">Kurukh</option>
                  </select>
                </div>
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all cursor-pointer shrink-0"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>

                {/* Progress Bar / Scrubber */}
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={audioProgress}
                    onChange={e => handleSeek(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{isPlaying ? 'Playing Narration...' : 'Paused'}</span>
                    <span>{Math.round(audioProgress)}% listened</span>
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVolumeChange(isMuted ? 0.8 : 0)}
                    className="text-slate-300 hover:text-white"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={e => handleVolumeChange(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Language Switcher Pills inside Reader */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                Switch Text Edition / भाषा बदलें:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { name: 'Santhali', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santhali)' },
                  { name: 'Mundari', label: 'ᱢᱩᱱᱰᱟᱨᱤ (Mundari)' },
                  { name: 'Ho', label: 'ᱦᱳ (Ho)' },
                  { name: 'Kurukh', label: 'कुड़ुख़ (Kurukh)' },
                  { name: 'English', label: 'English' },
                  { name: 'Hindi', label: 'हिन्दी (Hindi)' }
                ].map(l => (
                  <button
                    key={l.name}
                    type="button"
                    onClick={() => handleOpenLesson(readingLesson, l.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeModalLang === l.name
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mother tongue translation text */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-indigo-900">
                  {activeModalLang} Version
                </span>
                <button
                  type="button"
                  onClick={() => playSpeechFallback(translatedText)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  <Volume2 size={15} /> TTS Audio
                </button>
              </div>

              {isTranslating ? (
                <div className="py-6 text-center text-xs text-indigo-600 animate-pulse">
                  Translating chapter into {activeModalLang}...
                </div>
              ) : (
                <>
                  <p className="text-base font-bold text-indigo-950 leading-relaxed font-sans">
                    {translatedText}
                  </p>
                  {phoneticText && (
                    <div className="mt-3 pt-2 border-t border-indigo-200/50">
                      <span className="text-[10px] text-indigo-500 font-semibold uppercase block">
                        Roman Phonetic Pronunciation:
                      </span>
                      <p className="text-xs text-indigo-700 font-mono italic">
                        &ldquo;{phoneticText}&rdquo;
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Hindi Source */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed mb-4">
              <strong className="block text-slate-900 mb-1">Standard Content (मूल पाठ):</strong>
              {readingLesson.simplified_text || readingLesson.simplifiedText || readingLesson.source_text}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => toggleSaved(readingLesson.id || readingLesson._id || '', readingLesson.title)}
                className="px-3.5 py-2 border border-slate-200 hover:border-purple-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark size={14} className="text-purple-600" fill={saved.includes(String(readingLesson.id)) || saved.includes(String(readingLesson._id)) ? 'currentColor' : 'none'} />
                {saved.includes(String(readingLesson.id)) || saved.includes(String(readingLesson._id)) ? 'Saved Offline' : 'Save for Offline'}
              </button>

              <div className="flex items-center gap-2">
                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={handleMarkComplete}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Mark as Completed
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause()
                    setIsPlaying(false)
                    setReadingLesson(null)
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Done Reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}