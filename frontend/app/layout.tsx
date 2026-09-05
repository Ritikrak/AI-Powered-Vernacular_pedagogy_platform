import type { Metadata } from 'next'
import './globals.css'
import './reference-dashboard.css'

export const metadata: Metadata = {
  title: 'Vernacular Pedagogy Platform',
  description: 'A multilingual classroom for every learner.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
