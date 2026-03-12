import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Download } from 'lucide-react'

const API = '/api'

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-400',
  sent: 'bg-blue-500/20 text-blue-400',
  accepted: 'bg-warning/20 text-warning',
  paid: 'bg-success/20 text-success',
  cancelled: 'bg-danger/20 text-danger',
}

export default function Racuni() {
  const [tab, setTab] = useState('ponuda')
  const [list, setList] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const type = tab === 'svi' ? '' : tab
    fetch(`${API}/invoices${type ? `?type=${type}` : ''}`)
      .then((r) => r.json())
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [tab])

  useEffect(() => {
    fetch(`${API}/invoices/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const setStatus = async (id, status) => {
    try {
      await fetch(`${API}/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      load()
      if (stats) fetch(`${API}/invoices/stats`).then((r) => r.json()).then(setStats)
    } catch (e) {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Ponude & Računi</h1>
          <p className="text-text-secondary text-sm mt-1">Upravljanje ponudama i računima</p>
        </div>
        <Link to="/racuni/novi">
          <Button>Nova ponuda</Button>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-text-muted">Ukupno fakturirano</p>
            <p className="text-xl font-heading font-bold text-text-primary font-mono">{Number(stats.totalInvoiced || 0).toFixed(2)} €</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-text-muted">Plaćeno</p>
            <p className="text-xl font-heading font-bold text-success font-mono">{Number(stats.totalPaid || 0).toFixed(2)} €</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-text-muted">Čeka plaćanje</p>
            <p className="text-xl font-heading font-bold text-warning font-mono">{Number(stats.pendingPayment || 0).toFixed(2)} €</p>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Lista</CardTitle>
          <div className="flex gap-2">
            {['ponuda', 'racun', 'svi'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  tab === t ? 'bg-accent text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'ponuda' ? 'Ponude' : t === 'racun' ? 'Računi' : 'Svi'}
              </button>
            ))}
          </div>
        </CardHeader>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-text-muted">Učitavanje...</div>
        ) : !list.length ? (
          <p className="text-text-muted py-8 text-center">Nema dokumenata.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-3 pr-4">Broj</th>
                  <th className="pb-3 pr-4">Klijent</th>
                  <th className="pb-3 pr-4">Datum</th>
                  <th className="pb-3 pr-4">Iznos</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-bg-elevated/50">
                    <td className="py-3 pr-4 font-mono text-text-primary">{inv.invoice_number}</td>
                    <td className="py-3 pr-4 text-text-secondary">{inv.client_name}</td>
                    <td className="py-3 pr-4 text-text-secondary">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('hr-HR') : ''}</td>
                    <td className="py-3 pr-4 font-mono text-text-primary">{Number(inv.total || 0).toFixed(2)} €</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-bg-elevated'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 flex flex-wrap gap-1">
                      <a
                        href={`${API}/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-bg-elevated text-text-secondary hover:text-text-primary"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                      {inv.type === 'ponuda' && inv.status !== 'accepted' && (
                        <ConvertButton invoiceId={inv.id} onConvert={load} />
                      )}
                      {inv.type === 'racun' && inv.status !== 'paid' && (
                        <Button variant="ghost" size="sm" onClick={() => setStatus(inv.id, 'paid')}>
                          Označi plaćeno
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ConvertButton({ invoiceId, onConvert }) {
  const [loading, setLoading] = useState(false)
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)

  const convert = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/convert`, { method: 'POST' })
      if (res.ok) {
        toastSuccess('Pretvoreno u račun')
        onConvert()
      } else {
        const d = await res.json()
        toastError(d.error || 'Greška')
      }
    } catch (e) {
      toastError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={convert} disabled={loading}>
      {loading ? '...' : 'Pretvori u račun'}
    </Button>
  )
}
