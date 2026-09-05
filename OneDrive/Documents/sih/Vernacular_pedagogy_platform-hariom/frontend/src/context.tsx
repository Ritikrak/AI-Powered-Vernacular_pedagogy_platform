import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type Role } from './api'

type Toast = { id: number; message: string; tone: 'success' | 'error' | 'info' }
type AppContextValue = { role: Role | null; userName: string; toasts: Toast[]; signIn: (role: Role, name: string, email?: string) => void; signOut: () => void; toast: (message: string, tone?: Toast['tone']) => void; token: string | null }
const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => localStorage.getItem('vernacular-role') as Role | null)
  const [userName, setUserName] = useState(() => localStorage.getItem('vernacular-name') || 'Sunita Kumari')
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vernacular-token'))
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = (message: string, tone: Toast['tone'] = 'info') => { const id = Date.now(); setToasts(current => [...current, { id, message, tone }]); window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 3200) }
  const signIn = async (nextRole: Role, name: string, email = `${nextRole}@example.com`) => { try { const response = await api.post<{ access_token: string }>('/auth/demo', { role: nextRole, name, email }); localStorage.setItem('vernacular-token', response.data.access_token); setToken(response.data.access_token) } catch { toast('Offline mode enabled. Your workspace is still available.', 'info') } localStorage.setItem('vernacular-role', nextRole); localStorage.setItem('vernacular-name', name); localStorage.setItem('vernacular-email', email); setRole(nextRole); setUserName(name) }
  const signOut = () => { localStorage.removeItem('vernacular-role'); localStorage.removeItem('vernacular-name'); localStorage.removeItem('vernacular-token'); setRole(null); setToken(null) }
  useEffect(() => { document.documentElement.lang = 'en' }, [])
  const value = useMemo(() => ({ role, userName, toasts, signIn, signOut, toast, token }), [role, userName, toasts, token])
  return <AppContext.Provider value={value}>{children}<div className="toast-stack" aria-live="polite">{toasts.map(item => <div className={`toast ${item.tone}`} key={item.id}>{item.message}</div>)}</div></AppContext.Provider>
}

export function useApp() { const value = useContext(AppContext); if (!value) throw new Error('useApp must be used inside AppProvider'); return value }
