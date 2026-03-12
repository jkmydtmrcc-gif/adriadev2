import { useState } from 'react'
import { getWhatsAppLink } from '../lib/utils'
import { useStore } from '../store/useStore'
import { Button } from './ui/Button'
import { MessageModal } from './MessageModal'

function ScoreBadge({ score }) {
  const n = Number(score) || 0
  const variant = n <= 3 ? 'danger' : n <= 6 ? 'warning' : 'success'
  const bg = { danger: 'bg-danger/20 text-danger', warning: 'bg-warning/20 text-warning', success: 'bg-success/20 text-success' }[variant]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium ${bg}`}>
      {n}
    </span>
  )
}

function StatusBadge({ lead }) {
  const status = lead.status
  const f1 = lead.follow_up_count >= 1
  const f2 = lead.follow_up_count >= 2
  const wa = lead.whatsapp_sent
  if (lead.replied) return <span className="text-success text-xs font-medium">Odgovorilo</span>
  if (status === 'contacted') {
    if (f2) return <span className="text-text-muted text-xs">Follow-up 2</span>
    if (f1) return <span className="text-warning text-xs">Follow-up 1</span>
    if (wa) return <span className="text-text-secondary text-xs">📱 WA poslano</span>
    return <span className="text-text-secondary text-xs">📧 Sent</span>
  }
  const labels = { new: 'Novi', message_ready: 'Spremno', generation_failed: 'Greška' }
  return <span className="text-text-muted text-xs">{labels[status] || status}</span>
}

export function LeadsTable({ leads, loading, onUpdate }) {
  const [modalLead, setModalLead] = useState(null)
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)

  const markReplied = async (id) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replied: 1 }),
      })
      toastSuccess('Označeno kao odgovor')
      onUpdate?.()
    } catch (e) {
      toastError(e.message)
    }
  }

  const convertToClient = async (id) => {
    try {
      const res = await fetch(`/api/leads/${id}/convert-to-client`, { method: 'POST' })
      const data = await res.json()
      toastSuccess(data.existing ? 'Klijent već postoji' : 'Pretvoreno u klijenta')
      onUpdate?.()
      if (!data.existing && data.id) {
        window.location.href = `/racuni/novi?clientId=${data.id}`
      }
    } catch (e) {
      toastError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="pb-3 pr-4">Biznis</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Grad</th>
              <th className="pb-3 pr-4">Industrija</th>
              <th className="pb-3 pr-4">Score</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Poslano</th>
              <th className="pb-3 pr-4">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border/50 animate-pulse">
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-32" /></td>
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-28" /></td>
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-20" /></td>
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-24" /></td>
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-8" /></td>
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-16" /></td>
                <td className="py-3 pr-4"><div className="h-4 bg-bg-elevated rounded w-20" /></td>
                <td className="py-3 pr-4" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!leads.length) {
    return <p className="text-text-muted py-8 text-center">Nema leadova.</p>
  }

  return (
    <>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="pb-3 pr-4">Biznis</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Grad</th>
              <th className="pb-3 pr-4">Industrija</th>
              <th className="pb-3 pr-4">Score</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Poslano</th>
              <th className="pb-3 pr-4">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border/50 hover:bg-bg-elevated/50">
                <td className="py-3 pr-4 font-medium text-text-primary">{lead.business_name}</td>
                <td className="py-3 pr-4 text-text-secondary text-xs max-w-[140px] truncate" title={lead.email}>{lead.email || '—'}</td>
                <td className="py-3 pr-4 text-text-secondary">{lead.city}</td>
                <td className="py-3 pr-4 text-text-secondary">{lead.industry}</td>
                <td className="py-3 pr-4"><ScoreBadge score={lead.score} /></td>
                <td className="py-3 pr-4"><StatusBadge lead={lead} /></td>
                <td className="py-3 pr-4 text-text-muted text-xs whitespace-nowrap">
                  {lead.sent_at ? new Date(lead.sent_at).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  {lead.sent_from_domain && <span className="block text-[10px] text-text-muted" title="S računa">{lead.sent_from_domain}</span>}
                </td>
                <td className="py-3 pr-4 flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalLead(lead)}
                  >
                    Poruke
                  </Button>
                  {lead.phone && (
                    <a
                      href={getWhatsAppLink(lead.phone, lead.whatsapp_body)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-success/20 text-success hover:bg-success/30"
                    >
                      WhatsApp
                    </a>
                  )}
                  {lead.replied === 0 && (
                    <Button variant="ghost" size="sm" onClick={() => markReplied(lead.id)}>
                      Označi odgovor
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => convertToClient(lead.id)}>
                    → Klijent
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalLead && (
        <MessageModal
          lead={modalLead}
          onClose={() => setModalLead(null)}
        />
      )}
    </>
  )
}
