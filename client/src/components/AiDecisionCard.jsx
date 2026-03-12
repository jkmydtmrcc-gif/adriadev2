import { Card, CardHeader, CardTitle } from './ui/Card'

export function AiDecisionCard({ lastRun }) {
  let decision = null
  try {
    if (lastRun?.ai_decision_json) decision = JSON.parse(lastRun.ai_decision_json)
  } catch (_) {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧠 Zadnja AI odluka</CardTitle>
      </CardHeader>
      {decision ? (
        <div className="space-y-3 text-sm">
          <p className="text-text-secondary">{decision.reasoning}</p>
          {decision.targets?.length > 0 && (
            <ul className="space-y-2">
              {decision.targets.map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-text-primary font-medium">{t.city} + {t.industry}</span>
                  <span className="text-text-muted">šansa {t.conversionChance}/10</span>
                  <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden max-w-[80px]">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(t.conversionChance || 0) * 10}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {decision.todayTip && (
            <p className="text-accent/90 pt-2 border-t border-border">💡 {decision.todayTip}</p>
          )}
        </div>
      ) : (
        <p className="text-text-muted text-sm">Pokreni Autopilot da vidiš AI odluku.</p>
      )}
    </Card>
  )
}
