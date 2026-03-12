import { useStore } from '../store/useStore'

export function ActivityFeed() {
  const sseEvents = useStore((s) => s.sseEvents)

  if (sseEvents.length === 0) {
    return (
      <p className="text-text-muted text-sm py-4">Eventi će se pojaviti u realnom vremenu kad Autopilot radi.</p>
    )
  }

  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {sseEvents.map((ev, i) => (
        <li
          key={i}
          className="flex items-start gap-2 py-2 px-3 rounded-lg bg-bg-elevated border border-border text-sm animate-slide-in"
        >
          <span className="text-text-muted shrink-0">{ev.event}</span>
          {ev.message && <span className="text-text-secondary">{ev.message}</span>}
          {ev.lead && (
            <span className="text-text-primary truncate">
              {ev.lead.business_name} — {ev.lead.city}
            </span>
          )}
          {ev.total != null && <span className="text-accent font-mono">{ev.total}</span>}
        </li>
      ))}
    </ul>
  )
}
