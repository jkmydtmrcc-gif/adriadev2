import { Card, CardHeader, CardTitle } from './ui/Card'

const WARMING_DAYS = 15

export function StartupStatusCard({ accounts }) {
  if (!accounts?.length) return null
  const maxAge = Math.max(0, ...accounts.map((a) => a.domainAgeDays ?? 0))
  if (maxAge >= 30) return null

  const pct = Math.min(100, (maxAge / WARMING_DAYS) * 100)
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <CardTitle>🔥 Warming progress</CardTitle>
        <p className="text-text-secondary text-sm mt-1">
          Prvih 15 dana svaka domena ima niži dnevni limit. Dan {maxAge} / {WARMING_DAYS}.
        </p>
      </CardHeader>
      <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  )
}
