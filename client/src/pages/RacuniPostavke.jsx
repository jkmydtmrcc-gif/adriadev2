import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useStore } from '../store/useStore'

const API = '/api'

export default function RacuniPostavke() {
  const [form, setForm] = useState({
    agency_name: 'Adria Dev',
    owner_name: '',
    oib: '',
    address: '',
    city: '',
    iban: '',
    bank: '',
    email: '',
    phone: '',
    logo_base64: null,
    pdv_obveznik: false,
    invoice_prefix_offer: 'P',
    invoice_prefix_invoice: 'R',
    footer_note: 'Hvala na povjerenju!',
  })
  const [saving, setSaving] = useState(false)
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)

  useEffect(() => {
    fetch(`${API}/settings/agency`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.agency_name) {
          setForm({
            agency_name: d.agency_name || 'Adria Dev',
            owner_name: d.owner_name || '',
            oib: d.oib || '',
            address: d.address || '',
            city: d.city || '',
            iban: d.iban || '',
            bank: d.bank || '',
            email: d.email || '',
            phone: d.phone || '',
            logo_base64: d.logo_base64 || null,
            pdv_obveznik: !!d.pdv_obveznik,
            invoice_prefix_offer: d.invoice_prefix_offer || 'P',
            invoice_prefix_invoice: d.invoice_prefix_invoice || 'R',
            footer_note: d.footer_note || 'Hvala na povjerenju!',
          })
        }
      })
      .catch(() => {})
  }, [])

  const onLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, logo_base64: reader.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/settings/agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.agency_name !== undefined) {
        toastSuccess('Postavke spremljene')
      } else toastError('Greška')
    } catch (e) {
      toastError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Postavke agencije</h1>
        <p className="text-text-secondary text-sm mt-1">Podaci za PDF ponude i račune</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podaci agencije</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <input placeholder="Naziv agencije" value={form.agency_name} onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="Vlasnik / ime" value={form.owner_name} onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="OIB" value={form.oib} onChange={(e) => setForm((f) => ({ ...f, oib: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="Adresa" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="Grad" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="IBAN" value={form.iban} onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="Banka" value={form.bank} onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <input placeholder="Telefon" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.pdv_obveznik} onChange={(e) => setForm((f) => ({ ...f, pdv_obveznik: e.target.checked }))} className="rounded border-border" />
            <span className="text-sm text-text-primary">PDV obveznik</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Prefiks ponude (P)" value={form.invoice_prefix_offer} onChange={(e) => setForm((f) => ({ ...f, invoice_prefix_offer: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
            <input placeholder="Prefiks računa (R)" value={form.invoice_prefix_invoice} onChange={(e) => setForm((f) => ({ ...f, invoice_prefix_invoice: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm" />
          </div>
          <textarea placeholder="Footer na PDF-u" value={form.footer_note} onChange={(e) => setForm((f) => ({ ...f, footer_note: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm min-h-[60px]" />
          <div>
            <label className="block text-sm text-text-muted mb-1">Logo (upload)</label>
            <input type="file" accept="image/*" onChange={onLogoChange} className="text-sm text-text-secondary" />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={save} disabled={saving}>{saving ? 'Spremanje...' : 'Spremi'}</Button>
        </div>
      </Card>
    </div>
  )
}
