import { useEffect, useRef, useState } from 'react'
import { Copy, Languages, Mic, MicOff, Volume2, Sparkles, Zap, Check, BookOpen } from 'lucide-react'
import { translationApi, speechApi, playVernacularAudio, type TranslateAllResult } from './api'
import { useApp } from './context'
import { LOCAL_COMMON_WORDS, matchLocalCommonWord } from './data/commonWords'

export default function GoogleTranslatorPage() {
  const { toast, teacherSourceLanguage, setTeacherSourceLanguage } = useApp()
  const [sourceLanguage, setSourceLanguage] = useState(teacherSourceLanguage || 'Hindi')
  const [mode, setMode] = useState<'single' | 'all'>('all')
  const [sourceText, setSourceText] = useState('नमस्ते बच्चों! आज हम जल चक्र और बारिश के बारे में सीखेंगे।')
  const [targetLanguage, setTargetLanguage] = useState('Santhali')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [matchedVocabularyWord, setMatchedVocabularyWord] = useState<string | null>(null)
  const [playingDialectKey, setPlayingDialectKey] = useState<string | null>(null)

  // Synchronize with global teacher source language when changed externally
  useEffect(() => {
    if (teacherSourceLanguage && teacherSourceLanguage !== sourceLanguage) {
      setSourceLanguage(teacherSourceLanguage)
    }
  }, [teacherSourceLanguage])

  const handleSourceLanguageChange = (lang: string) => {
    setSourceLanguage(lang)
    setTeacherSourceLanguage(lang)
  }

  // Single translation result
  const [singleResult, setSingleResult] = useState<{
    text: string
    phonetic?: string
    audioUrl?: string
    audio_base64?: string | null
    provider?: string
  } | null>({
    text: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱜ ᱪᱟᱠᱨᱚ (Water Cycle) ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
    phonetic: "Johar gidra! Teheñ do abo da' chakra babat bon seṛaya.",
    provider: 'Regional Vernacular Engine'
  })

  // Batch all dialects result
  const [allResults, setAllResults] = useState<TranslateAllResult | null>(null)

  const recognitionRef = useRef<any>(null)
  const debounceTimerRef = useRef<any>(null)

  // Apply instant local translation if available
  const applyLocalMatch = (text: string): boolean => {
    const matched = matchLocalCommonWord(text)
    if (matched) {
      setMatchedVocabularyWord(`${matched.english} (${matched.hindi})`)
      if (mode === 'all') {
        const translations: Record<string, string> = {}
        for (const [lang, data] of Object.entries(matched.translations)) {
          translations[lang] = data.text
          translations[`${lang}_phonetic`] = data.phonetic
        }
        setAllResults({
          sourceText: text,
          sourceLanguage: sourceLanguage,
          translations,
          provider: 'pre-stored-vocabulary',
          wordId: matched.id,
          category: matched.category
        })
      } else {
        const trans = matched.translations[targetLanguage] || matched.translations.English
        if (trans) {
          setSingleResult({
            text: trans.text,
            phonetic: trans.phonetic,
            provider: 'Pre-Stored 5-Dialect Lexicon'
          })
        }
      }
      return true
    } else {
      setMatchedVocabularyWord(null)
      return false
    }
  }

  // Real-time translation trigger (debounced)
  useEffect(() => {
    if (!sourceText.trim()) {
      setMatchedVocabularyWord(null)
      return
    }

    // 1. Instant 0ms local match check
    applyLocalMatch(sourceText)

    // 2. Debounced backend sync for full translation and audio capability
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        if (mode === 'single') {
          const data = await translationApi.translateSpeech(sourceText, targetLanguage, sourceLanguage)
          setSingleResult({
            text: data.translated_text,
            phonetic: data.phonetic_text,
            audioUrl: data.audio_url,
            audio_base64: data.audio_base64,
            provider: data.provider
          })
        } else {
          const data = await translationApi.translateAll(sourceText, sourceLanguage)
          setAllResults(data)
          if (data.provider === 'pre-stored-vocabulary') {
            const matched = matchLocalCommonWord(sourceText)
            if (matched) setMatchedVocabularyWord(`${matched.english} (${matched.hindi})`)
          }
        }
      } catch {
        // Quiet fail in auto mode, fallback to local match if available
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [sourceText, mode, targetLanguage, sourceLanguage])

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast('Please enter text to translate', 'error')
      return
    }

    // Immediate local match
    applyLocalMatch(sourceText)

    setLoading(true)
    try {
      if (mode === 'single') {
        const data = await translationApi.translateSpeech(sourceText, targetLanguage, sourceLanguage)
        setSingleResult({
          text: data.translated_text,
          phonetic: data.phonetic_text,
          audioUrl: data.audio_url,
          audio_base64: data.audio_base64,
          provider: data.provider
        })
        toast(`${targetLanguage} translation ready!`, 'success')
      } else {
        const data = await translationApi.translateAll(sourceText, sourceLanguage)
        setAllResults(data)
        toast(`Translations generated across all regional dialects from ${sourceLanguage}!`, 'success')
      }
    } catch {
      toast('Translation failed, please check backend connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast('Speech recognition not supported in this browser. Please type your phrase.', 'info')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      const speechLangMap: Record<string, string> = {
        'Hindi': 'hi-IN',
        'English': 'en-IN',
        'Bengali': 'bn-IN',
        'Odia': 'or-IN',
        'Santhali': 'sat-IN',
        'Kurukh': 'kru-IN'
      }
      recognition.lang = speechLangMap[sourceLanguage] || 'hi-IN'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsRecording(true)
        toast(`Listening in ${sourceLanguage}... speak clearly`, 'info')
      }

      recognition.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
        setSourceText(text)
      }

      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)

      recognition.start()
      recognitionRef.current = recognition
    } catch {
      setIsRecording(false)
    }
  }

  const playAudio = (audioUrl?: string, text?: string, phonetic?: string, language = targetLanguage, key = 'single') => {
    if (key) setPlayingDialectKey(key)
    playVernacularAudio({
      text,
      language,
      phonetic: phonetic || text,
      audioUrl,
      onStart: () => {
        if (key) setPlayingDialectKey(key)
      },
      onEnd: () => {
        setPlayingDialectKey(null)
      },
      onError: () => {
        setPlayingDialectKey(null)
      }
    })
  }

  const speakText = (text: string, language = targetLanguage, phonetic?: string) => {
    playAudio(undefined, text, phonetic, language)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('Copied translation to clipboard', 'info')
  }

  const handleSelectCommonWord = (word: typeof LOCAL_COMMON_WORDS[0]) => {
    setSourceText(word.english)
    applyLocalMatch(word.english)
  }

  const categories = ['All', 'Greetings', 'Expressions', 'Politeness', 'Pedagogy', 'Nature', 'Daily', 'Actions', 'Social']

  const filteredCommonWords = selectedCategory === 'All'
    ? LOCAL_COMMON_WORDS
    : LOCAL_COMMON_WORDS.filter(w => w.category === selectedCategory)

  const dialectsList = [
    { key: 'Santhali', name: 'Santhali (ᱥᱟᱱᱛᱟᱲᱤ)', script: 'Ol Chiki', color: 'border-emerald-200 bg-emerald-50/70 text-emerald-950' },
    { key: 'Mundari', name: 'Mundari (ᱢᱩᱱᱰᱟᱨᱤ)', script: 'Mundari Bani', color: 'border-amber-200 bg-amber-50/70 text-amber-950' },
    { key: 'Ho', name: 'Ho (ᱦᱳ)', script: 'Warang Citi', color: 'border-sky-200 bg-sky-50/70 text-sky-950' },
    { key: 'Kurukh', name: 'Kurukh (कुड़ुख़)', script: 'Tolong Siki', color: 'border-purple-200 bg-purple-50/70 text-purple-950' },
    { key: 'English', name: 'English', script: 'Latin', color: 'border-slate-200 bg-slate-50 text-slate-900' }
  ]

  return (
    <section className="page-card translator-studio-page">
      {/* Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            AI MULTILINGUAL PEDAGOGY TRANSLATOR
          </span>
          <h1>Translation Studio</h1>
          <p>Real-time speech & text translation across 5 Jharkhand regional dialects with pre-stored 25+ vocabulary words.</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('all')}
          >
            ⚡ All 5 Dialects at Once
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'single' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('single')}
          >
            🎯 Single Dialect
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Source Speech / Text
            </label>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-slate-500 font-semibold">Source:</span>
              <select
                aria-label="Source Language"
                value={sourceLanguage}
                onChange={e => handleSourceLanguageChange(e.target.value)}
                className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Hindi">🇮🇳 Hindi (हिन्दी)</option>
                <option value="English">🌐 English</option>
                <option value="Bengali">🇧🇩 Bengali (বাংলা)</option>
                <option value="Odia">🇮🇳 Odia (ଓଡ଼ᱤଆ)</option>
                <option value="Santhali">🪶 Santhali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                <option value="Kurukh">🌿 Kurukh (कुड़ुख़)</option>
              </select>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Active
            </span>
            {matchedVocabularyWord && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <Zap size={12} className="text-amber-600 fill-amber-500" />
                Vocabulary Match: {matchedVocabularyWord}
              </span>
            )}
          </div>

          {mode === 'single' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Target Dialect:</span>
              <select
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Santhali">Santhali (Ol Chiki)</option>
                <option value="Mundari">Mundari (Mundari Bani)</option>
                <option value="Ho">Ho (Warang Citi)</option>
                <option value="Kurukh">Kurukh (Tolong Siki)</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          )}
        </div>

        <textarea
          rows={3}
          value={sourceText}
          onChange={e => setSourceText(e.target.value)}
          placeholder="Type any word or phrase (e.g. 'hello', 'good', 'bad', 'water', 'नमस्ते', 'पानी')..."
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 font-medium transition-all"
        />

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
              {isRecording ? 'Listening Live...' : 'Use Microphone'}
            </button>
            {sourceText && (
              <button
                type="button"
                onClick={() => setSourceText('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Languages size={15} />
            {loading ? 'Translating...' : mode === 'all' ? 'Translate to All 5 Dialects' : `Translate to ${targetLanguage}`}
          </button>
        </div>

        {/* 25+ Common Words Quick Dictionary Section */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600" />
              ⚡ Pre-Stored Common Words (25+ Vernacular Vocabulary)
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick clickable vocabulary chips */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto pr-1">
            {filteredCommonWords.map(word => {
              const isActive = sourceText.toLowerCase().trim() === word.english.toLowerCase() || sourceText.trim() === word.hindi
              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => handleSelectCommonWord(word)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 border-slate-200'
                  }`}
                  title={`Santhali: ${word.translations.Santhali?.text} | Kurukh: ${word.translations.Kurukh?.text}`}
                >
                  <span>{word.english}</span>
                  <span className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>/ {word.hindi}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* RESULTS DISPLAY */}
      <div className="mt-6">
        {mode === 'single' && singleResult && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded">
                  {targetLanguage} Translation
                </span>
                <span className="text-[10px] text-slate-400">({singleResult.provider || 'Vernacular Engine'})</span>
                {matchedVocabularyWord && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                    ⚡ Instant Match
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playAudio(singleResult.audioUrl, singleResult.text, singleResult.phonetic, targetLanguage, 'single')}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    playingDialectKey === 'single'
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Volume2 size={15} className={playingDialectKey === 'single' ? 'animate-bounce' : ''} />
                  {playingDialectKey === 'single' ? 'Playing...' : 'Play Speech'}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(singleResult.text)}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Copy text"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-3">
              <h2 className="text-2xl font-bold text-slate-900 leading-relaxed font-sans">
                {singleResult.text}
              </h2>
            </div>

            {singleResult.phonetic && (
              <div className="text-xs text-slate-500 font-mono italic">
                Phonetic Pronunciation: &ldquo;{singleResult.phonetic}&rdquo;
              </div>
            )}
          </div>
        )}

        {mode === 'all' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Multi-Dialect Translation Matrix (5 Active Dialects)
              </strong>
              {allResults?.provider === 'pre-stored-vocabulary' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check size={13} />
                  Pre-Stored Common Word Translation
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dialectsList.map(d => {
                const text = allResults?.translations?.[d.key] || (d.key === 'Santhali' ? singleResult?.text : '')
                const phonetic = allResults?.translations?.[`${d.key}_phonetic`] || (d.key === 'Santhali' ? singleResult?.phonetic : '')

                return (
                  <div
                    key={d.key}
                    className={`border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${d.color}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <strong className="text-sm font-bold block">{d.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{d.script}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {text && (
                            <button
                              type="button"
                              onClick={() => playAudio(undefined, text, phonetic, d.key, `batch-${d.key}`)}
                              className={`p-1.5 rounded-lg shadow-xs cursor-pointer transition-all ${
                                playingDialectKey === `batch-${d.key}`
                                  ? 'bg-emerald-600 text-white animate-pulse'
                                  : 'bg-white/90 hover:bg-white text-slate-700'
                              }`}
                              title="Listen"
                            >
                              <Volume2 size={14} className={playingDialectKey === `batch-${d.key}` ? 'animate-bounce' : ''} />
                            </button>
                          )}
                          {text && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(text)}
                              className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-xs cursor-pointer"
                              title="Copy"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xl font-bold mb-2 leading-relaxed min-h-[50px] flex items-center">
                        {text || <span className="text-sm font-normal text-slate-400">Translating...</span>}
                      </p>
                    </div>

                    {phonetic && (
                      <div className="pt-2 border-t border-slate-200/60 mt-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Phonetic Pronunciation:</span>
                        <p className="text-xs italic font-mono mt-0.5">&ldquo;{phonetic}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
