import { Card } from './ui/Card'
import { Users, Mail, MessageCircle, TrendingUp, Clock } from 'lucide-react'

const items = [
  { key: 'totalLeads', label: 'Ukupno leadova', icon: Users },
  { key: 'contacted', label: 'Kontaktirano', icon: Mail },
  { key: 'replied', label: 'Odgovorilo', icon: MessageCircle },
  { key: 'messageReady', label: 'Spremno za slanje', icon: TrendingUp },
  { key: 'followUpPending', label: 'Čeka follow-up', icon: Clock },
]

export function StatsCards({ data }) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="h-24 animate-pulse bg-bg-elevated" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {items.map(({ key, label, icon: Icon }) => (
        <Card key={key} className="p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary font-mono">
            {data[key] ?? 0}
          </p>
        </Card>
      ))}
    </div>
  )
}
