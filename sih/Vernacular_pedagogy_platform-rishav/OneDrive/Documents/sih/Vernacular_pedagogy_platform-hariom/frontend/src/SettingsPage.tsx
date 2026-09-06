import { useEffect, useState } from 'react'
import { Check, Database, Globe, Mic, RefreshCw, Server, Shield, Sparkles, Volume2 } from 'lucide-react'
import { healthApi } from './api'
import { useApp } from './context'

export default function SettingsPage() {
  const { userName, userEmail, role, preferredLanguage, setPreferredLanguage, toast } = useApp()
  const [health, setHealth] = useState<{
    status: string
    service: string
    version: string
    database: any
    geminiConfigured: boolean
  } | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [speechRate, setSpeechRate] = useState('0.9')
  const [autoPlayAudio, setAutoPlayAudio] = useState(true)

  const checkHealth = async () => {
    setLoadingHealth(true)
    try {
      const data = await healthApi.check()
      setHealth(data)
      toast('Connected to LokShiksha backend engine', 'success')
    } catch {
      toast('Could not reach backend health endpoint', 'error')
    } finally {
      setLoadingHealth(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <section className="page-card settings-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">PLATFORM PREFERENCES & SYSTEM HEALTH</span>
          <h1>System Settings</h1>
          <p>Configure vernacular language defaults, speech synthesis, and verify backend engine status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* User Profile & Dialect Configuration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <strong className="text-sm font-bold text-slate-900 block border-b border-slate-100 pb-3">
            Profile & Language Preferences
          </strong>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Authenticated User</label>
              <input
                type="text"
                disabled
                value={`${userName} (${role === 'teacher' ? 'Teacher' : 'Student'})`}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={userEmail}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Primary Mother Tongue</label>
              <select
                value={preferredLanguage}
                onChange={e => {
                  setPreferredLanguage(e.target.value)
                  toast(`Default mother tongue set to ${e.target.value}`, 'success')
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Santhali">Santhali (Ol Chiki - ᱥᱟᱱᱛᱟᱲᱤ)</option>
                <option value="Mundari">Mundari (Mundari Bani - ᱢᱩᱱᱰᱟᱨᱤ)</option>
                <option value="Ho">Ho (Warang Citi - ᱦᱳ)</option>
                <option value="Kurukh">Kurukh (Tolong Siki - कुड़ुख़)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Speech & Audio Preferences */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <strong className="text-sm font-bold text-slate-900 block border-b border-slate-100 pb-3 flex items-center gap-2">
            <Volume2 size={16} className="text-indigo-600" />
            Speech & Audio Synthesis Settings
          </strong>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Speech Playback Rate</label>
              <select
                value={speechRate}
                onChange={e => {
                  setSpeechRate(e.target.value)
                  toast('Audio speech rate updated', 'info')
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
              >
                <option value="0.8">0.8x (Slower for tribal beginners)</option>
                <option value="0.9">0.9x (Natural pedagogical pace)</option>
                <option value="1.0">1.0x (Standard normal)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <strong className="text-xs text-slate-800 block">Classroom Audio Auto-Play</strong>
                <span className="text-[10px] text-slate-500">Automatically play incoming speech translations</span>
              </div>
              <input
                type="checkbox"
                checked={autoPlayAudio}
                onChange={e => setAutoPlayAudio(e.target.checked)}
                className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
              <strong className="block font-bold">Offline Audio Mesh Ready</strong>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Native browser speech synthesis fallback is always active when remote cloud speech is not reachable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Engine Health Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-indigo-600" />
            <strong className="text-sm font-bold text-slate-900">Backend System & AI Health Status</strong>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RefreshCw size={13} className={loadingHealth ? 'animate-spin' : ''} /> Check Status
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">API Server</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <strong className="text-sm font-mono text-slate-800">
                {health?.status === 'healthy' ? 'Healthy (Port 8000)' : 'Connecting...'}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">AI Engine</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <strong className="text-sm font-mono text-slate-800">
                {health?.geminiConfigured ? 'Gemini 2.5 Flash' : 'Offline Vernacular Engine'}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Database Mode</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <strong className="text-sm font-mono text-slate-800">
                {health?.database?.status || 'In-Memory Resilient Mock Store'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
