import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from './ui/Card'

const API = '/api'

export function DailyPlanCard() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/autopilot/daily-plan`)
      .then((r) => r.json())
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Današnji plan</CardTitle>
        </CardHeader>
        <div className="h-24 bg-bg-elevated rounded-lg animate-pulse" />
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Današnji plan</CardTitle>
        </CardHeader>
        <p className="text-text-muted text-sm">Nije moguće učitati plan.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Današnji plan</CardTitle>
        <p className="text-text-muted text-xs mt-1">
          Autopilot se u 9:00 sam pokreće i danas pošalje max {plan.totalLimit} emailova (warming limit po domeni).
        </p>
      </CardHeader>
      <div className="flex gap-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-accent">
            {plan.totalRemaining}
          </div>
          <div className="text-xs text-text-muted">emailova danas</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-success">
            {plan.totalSent}
          </div>
          <div className="text-xs text-text-muted">već poslano</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-warning">
            {plan.totalLimit}
          </div>
          <div className="text-xs text-text-muted">dnevni limit</div>
        </div>
      </div>
      <div className="space-y-3">
        {plan.plan?.map((acc) => (
          <div key={acc.domain} className="flex items-center gap-3 flex-wrap">
            <div className="text-xs text-text-muted w-36 truncate" title={acc.domain}>
              {acc.domain}
            </div>
            <div className="flex-1 min-w-[80px] bg-bg-elevated rounded-full h-2 overflow-hidden">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${acc.limit ? (acc.sentToday / acc.limit) * 100 : 0}%` }}
              />
            </div>
            <div className="text-xs font-mono text-text-secondary">
              {acc.sentToday}/{acc.limit}
            </div>
            <div className="text-xs text-text-muted">{acc.phase}</div>
          </div>
        ))}
      </div>
      {plan.totalRemaining === 0 && plan.totalLimit > 0 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
          ✅ Dnevni limit dostignut! Sutra nastavlja automatski.
        </div>
      )}
    </Card>
  )
}
