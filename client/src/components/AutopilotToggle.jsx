import { useState } from 'react'
import { Button } from './ui/Button'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'

export function AutopilotToggle({ onStart }) {
  const autopilotRunning = useStore((s) => s.autopilotRunning)
  const setAutopilotRunning = useStore((s) => s.setAutopilotRunning)
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    setAutopilotRunning(true)
    try {
      await fetch('/api/autopilot/start', { method: 'POST' })
      onStart?.()
    } catch (e) {
      setAutopilotRunning(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={loading || autopilotRunning}
      className={cn(
        'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/50',
        autopilotRunning
          ? 'bg-accent/30 text-accent border-2 border-accent animate-pulse-glow cursor-wait'
          : 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40'
      )}
    >
      {autopilotRunning ? (
        <>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
          </span>
          Autopilot radi...
        </>
      ) : loading ? (
        'Pokrećem...'
      ) : (
        '▶ Start Autopilot'
      )}
    </button>
  )
}
