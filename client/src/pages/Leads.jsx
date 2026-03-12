import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { LeadsTable } from '../components/LeadsTable'

const API = '/api'

export default function Leads() {
  const [data, setData] = useState({ leads: [], total: 0 })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    fetch(`${API}/leads?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Leads</h1>
        <p className="text-text-secondary text-sm mt-1">Svi leadovi iz outreacha</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Tablica</CardTitle>
          <div className="flex flex-wrap gap-2">
            {['', 'new', 'message_ready', 'contacted', 'generation_failed'].map((s) => (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  status === s
                    ? 'bg-accent text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {s || 'Svi'}
              </button>
            ))}
          </div>
        </CardHeader>
        <LeadsTable
          leads={data.leads}
          loading={loading}
          onUpdate={load}
        />
      </Card>
    </div>
  )
}
