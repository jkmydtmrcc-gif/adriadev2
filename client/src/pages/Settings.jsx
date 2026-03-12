import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useStore } from '../store/useStore'

const API = '/api'

export default function Settings() {
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [testingId, setTestingId] = useState(null)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetch(`${API}/accounts`)
      .then((r) => r.text())
      .then((text) => {
        try {
          setAccounts(text ? JSON.parse(text) : [])
        } catch {
          setAccounts([])
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false))
  }, [])

  const refreshAccounts = () =>
    fetch(`${API}/accounts`)
      .then((r) => r.text())
      .then((text) => {
        try {
          setAccounts(text ? JSON.parse(text) : [])
        } catch {
          setAccounts([])
        }
      })

  const testConnection = async (id) => {
    setTestingId(id)
    try {
      const res = await fetch(`${API}/accounts/${id}/test`, { method: 'POST' })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        toastError('Server nije vratio valjani odgovor. Je li backend pokrenut?')
        return
      }
      if (data.ok) toastSuccess('Veza uspješna ✅')
      else toastError(data.error || 'Greška')
    } catch (e) {
      toastError(e.message)
    } finally {
      setTestingId(null)
    }
  }

  const deleteAccount = async (id) => {
    if (!window.confirm('Obrisati ovaj email račun?')) return
    try {
      const res = await fetch(`${API}/accounts/${id}`, { method: 'DELETE' })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        toastError('Server nije vratio valjani odgovor.')
        return
      }
      if (data.ok !== false) {
        toastSuccess('Račun obrisan')
        refreshAccounts()
      } else toastError(data.error || 'Greška')
    } catch (e) {
      toastError(e.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-1">Settings</h1>
        <p className="text-text-secondary text-sm md:text-base">
          SMTP računi za slanje emailova. Preporuka: Brevo (smtp-relay.brevo.com, port 587).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email računi</CardTitle>
          <p className="text-text-muted text-sm mt-1">
            Dodaj do 5 SMTP računa. Svaki ima dnevni limit prema warming rasporedu.
          </p>
          <p className="text-text-muted text-xs mt-1">
            Autopilot šalje mailove svaki dan u <strong className="text-text-secondary">9:00</strong> (vrijeme servera). Follow-up mailovi u 10:00.
          </p>
        </CardHeader>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-text-muted">Učitavanje...</div>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc) =>
              editingId === acc.id ? (
                <EditAccountForm
                  key={acc.id}
                  account={acc}
                  onSaved={() => {
                    setEditingId(null)
                    refreshAccounts()
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <AccountRow
                  key={acc.id}
                  account={acc}
                  onTest={() => testConnection(acc.id)}
                  onEdit={() => setEditingId(acc.id)}
                  onDelete={() => deleteAccount(acc.id)}
                  testing={testingId === acc.id}
                />
              )
            )}
            {accounts.length < 5 && (
              <AddAccountForm onAdded={refreshAccounts} />
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API ključevi</CardTitle>
          <p className="text-text-muted text-sm mt-1">
            Postavi u .env datoteci u rootu projekta: GOOGLE_MAPS_API_KEY, OPENAI_API_KEY
          </p>
        </CardHeader>
        <div className="text-sm text-text-secondary space-y-2">
          <p>• Google Maps API: Places (Text Search + Details)</p>
          <p>• OpenAI API: za gpt-4o-mini (AI odluke i poruke)</p>
        </div>
      </Card>
    </div>
  )
}

function AccountRow({ account, onTest, onEdit, onDelete, testing }) {
  return (
    <div className="p-4 rounded-lg bg-bg-elevated border border-border flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{account.label || account.email}</p>
        <p className="text-sm text-text-muted truncate">{account.email}</p>
        <p className="text-xs text-text-muted mt-1">
          Danas: {account.sent_today ?? 0} / limit (warming)
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Uredi
        </Button>
        <Button variant="secondary" size="sm" onClick={onTest} disabled={testing}>
          {testing ? 'Testiram...' : 'Testiraj vezu'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          Obriši
        </Button>
      </div>
    </div>
  )
}

function EditAccountForm({ account, onSaved, onCancel }) {
  const [form, setForm] = useState({
    label: account.label || '',
    email: account.email || '',
    smtp_host: account.smtp_host || 'smtp-relay.brevo.com',
    smtp_port: account.smtp_port ?? 587,
    smtp_user: account.smtp_user || '',
    smtp_pass: '',
    daily_limit: account.daily_limit ?? 50,
  })
  const [saving, setSaving] = useState(false)
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)

  const save = async () => {
    if (!form.email || !form.smtp_host || !form.smtp_user) {
      toastError('Ispuni email, SMTP host i user')
      return
    }
    setSaving(true)
    try {
      const body = {
        label: form.label,
        email: form.email,
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        smtp_user: form.smtp_user,
        daily_limit: form.daily_limit,
      }
      if (form.smtp_pass) body.smtp_pass = form.smtp_pass
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        toastError('Server nije vratio valjani odgovor.')
        return
      }
      if (data.id) {
        toastSuccess('Postavke spremljene')
        onSaved()
      } else toastError(data.error || 'Greška')
    } catch (e) {
      toastError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 rounded-lg bg-bg-elevated border border-border space-y-3">
      <p className="text-sm font-medium text-text-primary">Uredi račun</p>
      <input
        placeholder="Label (npr. Brevo 1)"
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        placeholder="Email *"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        placeholder="SMTP host *"
        value={form.smtp_host}
        onChange={(e) => setForm((f) => ({ ...f, smtp_host: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        type="number"
        placeholder="Port"
        value={form.smtp_port}
        onChange={(e) => setForm((f) => ({ ...f, smtp_port: +e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
      />
      <input
        placeholder="SMTP user *"
        value={form.smtp_user}
        onChange={(e) => setForm((f) => ({ ...f, smtp_user: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        type="password"
        placeholder="SMTP pass (ostavi prazno da zadržiš trenutnu)"
        value={form.smtp_pass}
        onChange={(e) => setForm((f) => ({ ...f, smtp_pass: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        type="number"
        placeholder="Dnevni limit"
        value={form.daily_limit}
        onChange={(e) => setForm((f) => ({ ...f, daily_limit: +e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? 'Spremanje...' : 'Spremi'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Odustani
        </Button>
      </div>
    </div>
  )
}

function AddAccountForm({ onAdded }) {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    label: '',
    email: '',
    smtp_host: 'smtp-relay.brevo.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    daily_limit: 50,
  })
  const [saving, setSaving] = useState(false)
  const toastSuccess = useStore((s) => s.toastSuccess)
  const toastError = useStore((s) => s.toastError)

  const save = async () => {
    if (!form.email || !form.smtp_host || !form.smtp_user || !form.smtp_pass) {
      toastError('Ispuni email, SMTP host, user i pass')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        toastError('Server nije vratio valjani odgovor. Je li backend pokrenut?')
        return
      }
      if (data.id) {
        toastSuccess('Račun dodan')
        setShow(false)
        setForm({ label: '', email: '', smtp_host: 'smtp-relay.brevo.com', smtp_port: 587, smtp_user: '', smtp_pass: '', daily_limit: 50 })
        onAdded()
      } else toastError(data.error || 'Greška')
    } catch (e) {
      toastError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!show) {
    return (
      <Button variant="secondary" onClick={() => setShow(true)}>
        + Dodaj email račun
      </Button>
    )
  }

  return (
    <div className="p-4 rounded-lg bg-bg-elevated border border-border space-y-3">
      <p className="text-sm text-text-secondary">Brevo: Host smtp-relay.brevo.com, Port 587</p>
      <input
        placeholder="Label (npr. Brevo 1)"
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        placeholder="Email *"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        placeholder="SMTP host *"
        value={form.smtp_host}
        onChange={(e) => setForm((f) => ({ ...f, smtp_host: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        type="number"
        placeholder="Port"
        value={form.smtp_port}
        onChange={(e) => setForm((f) => ({ ...f, smtp_port: +e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm"
      />
      <input
        placeholder="SMTP user *"
        value={form.smtp_user}
        onChange={(e) => setForm((f) => ({ ...f, smtp_user: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <input
        type="password"
        placeholder="SMTP pass (API key) *"
        value={form.smtp_pass}
        onChange={(e) => setForm((f) => ({ ...f, smtp_pass: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? 'Spremanje...' : 'Spremi'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
          Odustani
        </Button>
      </div>
    </div>
  )
}
