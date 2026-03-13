import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const AUTH_KEY = 'adria_dashboard_auth'
const CORRECT_PASSWORD = 'AdriaDev2025!'

export default function AuthGuard({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(AUTH_KEY)
    if (saved === 'true') setIsLoggedIn(true)
    setLoaded(true)
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setIsLoggedIn(true)
      sessionStorage.setItem(AUTH_KEY, 'true')
      setError('')
    } else {
      setError('Pogrešna lozinka!')
      setPassword('')
    }
  }

  if (!loaded) return null

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-full max-w-md px-4">
          <div className="bg-bg-surface border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-text-primary mb-1 font-heading">
              Adria Dev
            </h1>
            <p className="text-text-muted text-center text-sm mb-8">
              Outreach Dashboard — Admin pristup
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Unesite lozinku..."
                className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                autoFocus
              />
              {error && (
                <p className="text-danger text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Prijavi se
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return children
}
