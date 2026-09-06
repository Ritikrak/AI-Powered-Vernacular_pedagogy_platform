import { useEffect, useState } from 'react'
import { BookOpen, Globe, Headphones, Languages, Play, Sparkles, Volume2, Search, ArrowRight } from 'lucide-react'
import { lessonApi, translationApi, type Lesson } from './api'
import { useApp } from './context'

interface MultilingualLessonView {
  lesson: Lesson
  translations: Record<string, { text: string; phonetic?: string }>
}

export default function TranslatedLessonsPage() {
  const { toast } = useApp()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [activeTab, setActiveTab] = useState<'santhali' | 'mundari' | 'ho' | 'kurukh' | 'all'>('all')
  const [translationsCache, setTranslationsCache] = useState<Record<string, Record<string, { text: string; phonetic?: string }>>>({})
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await lessonApi.list()
        setLessons(data)
        if (data.length > 0) {
          setSelectedLesson(data[0])
          void loadMultiTranslations(data[0])
        }
      } catch {
        toast('Could not fetch translated lessons catalog', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadMultiTranslations = async (lesson: Lesson) => {
    const key = String(lesson.id || lesson._id)
    if (translationsCache[key]) return

    setIsTranslating(true)
    try {
      const textToTranslate = lesson.simplified_text || lesson.simplifiedText || lesson.source_text
      const res = await translationApi.translateAll(textToTranslate, 'Hindi')
      const dialectMap: Record<string, { text: string; phonetic?: string }> = {
        Santhali: {
          text: res.translations['Santhali'] || '',
          phonetic: res.translations['Santhali_phonetic'] || ''
        },
        Mundari: {
          text: res.translations['Mundari'] || '',
          phonetic: res.translations['Mundari_phonetic'] || ''
        },
        Ho: {
          text: res.translations['Ho'] || '',
          phonetic: res.translations['Ho_phonetic'] || ''
        },
        Kurukh: {
          text: res.translations['Kurukh'] || '',
          phonetic: res.translations['Kurukh_phonetic'] || ''
        },
        English: {
          text: res.translations['English'] || '',
          phonetic: res.translations['English_phonetic'] || ''
        }
      }

      setTranslationsCache(prev => ({ ...prev, [key]: dialectMap }))
    } catch {
      toast('Failed to load multi-dialect translations', 'error')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    void loadMultiTranslations(lesson)
  }

  const playSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const currentTranslations = selectedLesson
    ? translationsCache[String(selectedLesson.id || selectedLesson._id)]
    : null

  const dialects = [
    { key: 'Santhali', name: 'संथाली / Santhali', script: 'Ol Chiki (ᱥᱟᱱᱛᱟᱲᱤ)', color: 'border-emerald-200 bg-emerald-50/60' },
    { key: 'Mundari', name: 'मुंडारी / Mundari', script: 'Mundari Bani (ᱢᱩᱱᱰᱟᱨᱤ)', color: 'border-amber-200 bg-amber-50/60' },
    { key: 'Ho', name: 'हो / Ho', script: 'Warang Citi (ᱦᱳ)', color: 'border-sky-200 bg-sky-50/60' },
    { key: 'Kurukh', name: 'कुड़ुख़ / Kurukh', script: 'Tolong Siki (ᱠᱩᱲᱩᱠᱷ)', color: 'border-purple-200 bg-purple-50/60' }
  ]

  return (
    <section className="page-card translated-lessons-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">MULTILINGUAL PEDAGOGY EXPLORER</span>
          <h1>Translated Lessons Reader</h1>
          <p>Read curriculum chapters simultaneously across Jharkhand tribal dialects with native scripts and phonetics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Lesson Selector */}
        <div className="lg:col-span-4 space-y-3">
          <strong className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Select Curriculum Lesson
          </strong>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading curriculum...</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {lessons.map(lesson => {
                const isSelected = selectedLesson?.id === lesson.id || selectedLesson?._id === lesson._id
                return (
                  <button
                    key={lesson.id || lesson._id}
                    type="button"
                    onClick={() => handleSelectLesson(lesson)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                      <span className="font-semibold uppercase">{lesson.subject}</span>
                      <span>{lesson.grade_level || lesson.gradeLevel || 'Class 5'}</span>
                    </div>
                    <strong className="text-sm block line-clamp-1">{lesson.title}</strong>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Comparative Reader */}
        <div className="lg:col-span-8 space-y-5">
          {selectedLesson ? (
            <>
              {/* Selected Lesson Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                    {selectedLesson.subject} • {selectedLesson.grade_level || selectedLesson.gradeLevel || 'Class 5'}
                  </span>
                  <button
                    type="button"
                    onClick={() => playSpeech(selectedLesson.source_text)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Volume2 size={14} /> Listen Hindi
                  </button>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{selectedLesson.title}</h2>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <strong>Hindi Source:</strong> {selectedLesson.source_text}
                </div>
              </div>

              {/* Multi-Dialect Vernacular Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Languages size={17} className="text-indigo-600" />
                    Regional Dialect Translations
                  </strong>
                  {isTranslating && (
                    <span className="text-xs text-indigo-600 animate-pulse font-medium">
                      Generating vernacular translations...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dialects.map(d => {
                    const trans = currentTranslations ? currentTranslations[d.key] : null
                    return (
                      <div
                        key={d.key}
                        className={`border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${d.color}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <strong className="text-slate-900 text-sm block">{d.name}</strong>
                              <span className="text-[10px] text-slate-500 font-mono">{d.script}</span>
                            </div>
                            {trans?.text && (
                              <button
                                type="button"
                                onClick={() => playSpeech(trans.text)}
                                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 shadow-xs"
                                title="Listen pronunciation"
                              >
                                <Volume2 size={15} />
                              </button>
                            )}
                          </div>

                          <p className="text-base font-bold text-slate-900 mb-2 leading-relaxed font-sans min-h-[50px]">
                            {trans?.text || 'Loading translation...'}
                          </p>
                        </div>

                        {trans?.phonetic && (
                          <div className="pt-3 border-t border-slate-200/60 mt-2">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                              Roman Phonetic:
                            </span>
                            <p className="text-xs text-slate-700 italic font-mono">
                              &ldquo;{trans.phonetic}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a lesson from the left to view multi-dialect translations.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
