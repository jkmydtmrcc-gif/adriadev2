import { Card, CardHeader, CardTitle } from './ui/Card'

export function DomainCards({ accounts }) {
  if (!accounts?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📧 Domena / limit danas</CardTitle>
        </CardHeader>
        <p className="text-text-muted text-sm">Dodaj email račune u Settings.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📧 Domena / limit danas</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {accounts.map((acc) => {
          const limit = acc.limitToday ?? 50
          const sent = acc.sent_today ?? 0
          const pct = limit ? Math.min(100, (sent / limit) * 100) : 0
          const color = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success'
          return (
            <div key={acc.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-primary truncate">{acc.label || acc.email}</span>
                <span className="text-text-muted font-mono">
                  {sent} / {limit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
