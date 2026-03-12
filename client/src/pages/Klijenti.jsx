import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const API = '/api'

export default function Klijenti() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Klijenti</h1>
          <p className="text-text-secondary text-sm mt-1">Lista klijenata za ponude i račune</p>
        </div>
        <Link to="/racuni/novi">
          <Button>Nova ponuda</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista klijenata</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-bg-elevated animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-text-muted py-8 text-center">Nema klijenata. Dodaj iz Leads (Pretvori u klijenta) ili kroz Novu ponudu.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-3 pr-4">Ime</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Telefon</th>
                  <th className="pb-3 pr-4">Grad</th>
                  <th className="pb-3 pr-4">Akcija</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-bg-elevated/50">
                    <td className="py-3 pr-4 font-medium text-text-primary">{c.name}</td>
                    <td className="py-3 pr-4 text-text-secondary">{c.email || '—'}</td>
                    <td className="py-3 pr-4 text-text-secondary">{c.phone || '—'}</td>
                    <td className="py-3 pr-4 text-text-secondary">{c.city || '—'}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/racuni/novi?clientId=${c.id}`}>
                        <Button variant="ghost" size="sm">Nova ponuda</Button>
                      </Link>
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
