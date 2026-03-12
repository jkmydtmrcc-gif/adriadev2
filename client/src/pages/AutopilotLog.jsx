import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'

const API = '/api'

export default function AutopilotLog() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/autopilot/runs`)
      .then((r) => r.json())
      .then(setRuns)
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }, [])

  const statusColor = (s) => {
    if (s === 'completed') return 'text-success'
    if (s === 'failed') return 'text-danger'
    return 'text-warning'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Autopilot log</h1>
        <p className="text-text-secondary text-sm mt-1">Povijest pokretanja autopilota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Runovi</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-bg-elevated animate-pulse" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <p className="text-text-muted py-8 text-center">Nema runova.</p>
        ) : (
          <ul className="space-y-3">
            {runs.map((run) => (
              <li
                key={run.id}
                className="p-4 rounded-lg bg-bg-elevated border border-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-sm text-text-primary">
                    #{run.id} — {run.started_at ? new Date(run.started_at).toLocaleString('hr-HR') : ''}
                  </span>
                  <span className={`text-sm font-medium ${statusColor(run.status)}`}>
                    {run.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span>Leadova: {run.leads_found ?? 0}</span>
                  <span>Poruka: {run.messages_generated ?? 0}</span>
                  <span>Emailova: {run.emails_sent ?? 0}</span>
                </div>
                {run.log && (
                  <pre className="mt-3 p-3 rounded-lg bg-bg-primary text-xs text-text-muted overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {run.log}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
