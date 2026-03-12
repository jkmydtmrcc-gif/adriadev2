import { useState } from 'react'
import { Sidebar } from './Sidebar'

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-bg-surface border-b border-border px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-bg-elevated text-text-primary"
            aria-label="Meni"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-heading font-semibold text-lg">Adria Dev</span>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
