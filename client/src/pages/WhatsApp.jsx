import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getWhatsAppLink } from '../lib/utils'
import { useStore } from '../store/useStore'

const API = '/api'
const WHATSAPP_DAILY_LIMIT = 15
const STORAGE_KEY = 'adria_whatsapp_sent_date'
const STORAGE_COUNT = 'adria_whatsapp_sent_count'

function getSentToday() {
  const today = new Date().toDateString()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== today) return 0
    return parseInt(localStorage.getItem(STORAGE_COUNT) || '0', 10)
  } catch {
    return 0
  }
}

function incrementSentToday() {
  const today = new Date().toDateString()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const count = saved === today ? parseInt(localStorage.getItem(STORAGE_COUNT) || '0', 10) + 1 : 1
    localStorage.setItem(STORAGE_KEY, today)
    localStorage.setItem(STORAGE_COUNT, String(count))
    return count
  } catch {
    return 0
  }
}

export default function WhatsApp() {
  const [leads, setLeads] = useState([])
  const [sentToday, setSentToday] = useState(getSentToday)
  const [loading, setLoading] = useState(true)
  const toastSuccess = useStore((s) => s.toastSuccess)

  const load = () => {
    setLoading(true)
    fetch(`${API}/leads/whatsapp-queue`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    setSentToday(getSentToday())
  }, [])

  const markSent = async (id) => {
    try {
      await fetch(`${API}/leads/${id}/mark-whatsapp-sent`, { method: 'POST' })
      toastSuccess('Označeno kao poslano')
      setSentToday(incrementSentToday())
      load()
    } catch (e) {
      toastSuccess('Greška')
    }
  }

  const skip = async (id) => {
    await fetch(`${API}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_sent: 1 }),
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">WhatsApp queue</h1>
        <p className="text-text-secondary text-sm mt-1">Ručno šalji WhatsApp poruke. Limit 15/dan preporučen.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Red čekanja</CardTitle>
          <p className={`text-sm font-mono ${sentToday >= WHATSAPP_DAILY_LIMIT ? 'text-danger' : 'text-text-secondary'}`}>
            Poslano danas: {sentToday} / {WHATSAPP_DAILY_LIMIT}
          </p>
        </CardHeader>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-bg-elevated animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <p className="text-text-muted py-8 text-center">Nema leadova s telefonom koji čekaju WhatsApp.</p>
        ) : (
          <ul className="space-y-4">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="p-4 rounded-xl bg-bg-elevated border border-border flex flex-col md:flex-row md:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{lead.business_name}</p>
                  <p className="text-sm text-text-secondary">{lead.city} · {lead.industry}</p>
                  <p className="text-xs text-text-muted font-mono mt-1">{lead.phone}</p>
                  <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-mono ${
                    lead.score <= 3 ? 'bg-danger/20 text-danger' : lead.score <= 6 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                  }`}>
                    Score {lead.score}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-text-muted block mb-1">Poruka (možeš editirati)</label>
                  <textarea
                    defaultValue={lead.whatsapp_body || ''}
                    className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm min-h-[80px]"
                    rows={3}
                    onChange={(e) => {
                      lead.whatsapp_body = e.target.value
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <a
                    href={getWhatsAppLink(lead.phone, lead.whatsapp_body)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-success/20 text-success hover:bg-success/30 font-medium text-sm"
                  >
                    📱 Otvori WhatsApp
                  </a>
                  <Button variant="secondary" size="sm" onClick={() => markSent(lead.id)}>
                    Označi poslano
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => skip(lead.id)}>
                    Preskoči
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
