import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useStore } from '../store/useStore'

const API = '/api'

const PRESETS = [
  { label: 'Web stranica — Basic', price: 400 },
  { label: 'Web stranica — Standard', price: 700 },
  { label: 'Web stranica — Premium', price: 1200 },
  { label: 'SEO — mjesečno', price: 150 },
  { label: 'SEO — jednokratna optimizacija', price: 300 },
  { label: 'Google My Business setup', price: 100 },
  { label: 'Booking sustav', price: 200 },
  { label: 'Održavanje web stranice — mjesečno', price: 50 },
]

export default function RacuniNovi() {
  const [searchParams] = useSearchParams()
  const clientIdParam = searchParams.get('clientId')
  const navigate = useNavigate()
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)

  const [clients, setClients] = useState([])
  const [type, setType] = useState('ponuda')
  const [clientId, setClientId] = useState(clientIdParam || '')
  const [newClient, setNewClient] = useState(null)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => setClients([]))
  }, [])

  useEffect(() => {
    if (clientIdParam) setClientId(clientIdParam)
  }, [clientIdParam])

  const addItem = () => setItems((i) => [...i, { description: '', quantity: 1, price: 0 }])
  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx))
  const updateItem = (idx, field, value) => {
    setItems((i) => i.map((it, j) => (j === idx ? { ...it, [field]: value } : it)))
  }

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0)
  const taxRate = 0
  const taxAmount = 0
  const total = subtotal

  const addPreset = (preset) => {
    setItems((i) => [...i, { description: preset.label, quantity: 1, price: preset.price }])
  }

  const saveDraft = async (openPdf = false) => {
    const cid = newClient ? await createClient() : clientId
    if (!cid) {
      toastError('Odaberi klijenta ili unesi novog')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          client_id: cid,
          due_date: dueDate,
          items_json: items,
          notes,
        }),
      })
      const data = await res.json()
      if (data.id) {
        toastSuccess('Spremljeno')
        if (openPdf) window.open(`${API}/invoices/${data.id}/pdf`, '_blank')
        navigate('/racuni')
      } else toastError(data.error || 'Greška')
    } catch (e) {
      toastError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const createClient = async () => {
    if (!newClient?.name) return null
    const res = await fetch(`${API}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    })
    const data = await res.json()
    return data.id || null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Nova ponuda / račun</h1>
        <p className="text-text-secondary text-sm mt-1">Ispuni podatke i spremi draft ili preuzmi PDF</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klijent</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <label className="block text-sm text-text-muted">Odaberi klijenta</label>
          <select
            value={newClient ? '' : clientId}
            onChange={(e) => {
              setClientId(e.target.value)
              setNewClient(null)
            }}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
          >
            <option value="">-- Odaberi --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setNewClient({ name: '', email: '', phone: '', address: '', city: '', oib: '' })}
            className="text-sm text-accent hover:underline"
          >
            + Novi klijent
          </button>
          {newClient && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <input placeholder="Ime *" value={newClient.name} onChange={(e) => setNewClient((c) => ({ ...c, name: e.target.value }))} className="col-span-2 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
              <input placeholder="Email" value={newClient.email} onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
              <input placeholder="Telefon" value={newClient.phone} onChange={(e) => setNewClient((c) => ({ ...c, phone: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
              <input placeholder="Adresa" value={newClient.address} onChange={(e) => setNewClient((c) => ({ ...c, address: e.target.value }))} className="col-span-2 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
              <input placeholder="Grad" value={newClient.city} onChange={(e) => setNewClient((c) => ({ ...c, city: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
              <input placeholder="OIB" value={newClient.oib} onChange={(e) => setNewClient((c) => ({ ...c, oib: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tip i datum</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={type === 'ponuda'} onChange={() => setType('ponuda')} className="rounded border-border" />
            <span className="text-sm text-text-primary">Ponuda</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={type === 'racun'} onChange={() => setType('racun')} className="rounded border-border" />
            <span className="text-sm text-text-primary">Račun</span>
          </label>
          <label className="text-sm text-text-muted">
            Rok plaćanja
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="ml-2 px-2 py-1 rounded bg-bg-primary border border-border text-text-primary" />
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stavke</CardTitle>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} variant="ghost" size="sm" onClick={() => addPreset(p)}>
                {p.label} — {p.price}€
              </Button>
            ))}
          </div>
        </CardHeader>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                placeholder="Opis"
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                className="col-span-12 md:col-span-6 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', +e.target.value)}
                className="col-span-4 md:col-span-2 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
              />
              <input
                type="number"
                step={0.01}
                value={item.price}
                onChange={(e) => updateItem(idx, 'price', +e.target.value)}
                className="col-span-4 md:col-span-2 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
              />
              <span className="col-span-2 font-mono text-sm text-text-secondary">
                {(item.quantity * item.price).toFixed(2)} €
              </span>
              <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="col-span-2">Obriši</Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addItem}>+ Dodaj stavku</Button>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-end gap-4 text-sm">
          <span className="text-text-muted">Subtotal: {subtotal.toFixed(2)} €</span>
          {taxRate > 0 && <span className="text-text-muted">PDV: {taxAmount.toFixed(2)} €</span>}
          <span className="font-heading font-semibold text-accent">Ukupno: {total.toFixed(2)} €</span>
        </div>
      </Card>

      <Card>
        <label className="block text-sm text-text-muted mb-2">Napomena</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm min-h-[80px]" />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => saveDraft(false)} disabled={saving}>
          {saving ? 'Spremanje...' : 'Spremi draft'}
        </Button>
        <Button variant="secondary" onClick={() => saveDraft(true)} disabled={saving}>
          Spremi i preuzmi PDF
        </Button>
        <Button variant="ghost" onClick={() => navigate('/racuni')}>
          Natrag
        </Button>
      </div>
    </div>
  )
}
