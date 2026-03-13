import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  FileText,
  BarChart3,
  Settings,
  Receipt,
  UserCircle,
  Wrench,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/whatsapp', label: 'WhatsApp queue', icon: MessageCircle },
  { to: '/autopilot-log', label: 'Autopilot log', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/racuni', label: 'Ponude & Računi', icon: Receipt },
  { to: '/klijenti', label: 'Klijenti', icon: UserCircle },
  { to: '/racuni/postavke', label: 'Postavke agencije', icon: Wrench },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }) {
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-bg-surface border-r border-border flex flex-col',
        'transform transition-transform duration-200 ease-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        <span className="font-heading font-bold text-xl text-accent">Adria Dev</span>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-bg-elevated text-text-secondary"
          aria-label="Zatvori"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('adria_dashboard_auth')
            window.location.reload()
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-danger hover:bg-bg-elevated transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Odjava
        </button>
      </div>
    </aside>
  )
}
