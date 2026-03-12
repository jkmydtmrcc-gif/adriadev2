import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { AutopilotToggle } from '../components/AutopilotToggle'
import { AiDecisionCard } from '../components/AiDecisionCard'
import { ActivityFeed } from '../components/ActivityFeed'
import { StatsCards } from '../components/StatsCards'
import { DomainCards } from '../components/DomainCards'
import { StartupStatusCard } from '../components/StartupStatusCard'
import { useStore } from '../store/useStore'

const API = '/api'

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const setDashboardStore = useStore((s) => s.setDashboard)
  const addSseEvent = useStore((s) => s.addSseEvent)
  const setAutopilotRunning = useStore((s) => s.setAutopilotRunning)
  const eventSourceRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/stats/dashboard`)
      .then((r) => r.json())
      .then((d) => {
        setDashboard(d)
        setDashboardStore(d)
      })
      .catch(() => setDashboard(null))
  }, [setDashboardStore])

  useEffect(() => {
    const es = new EventSource(`${API}/autopilot/stream`)
    eventSourceRef.current = es
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        addSseEvent(data)
        if (data.event === 'completed' || data.event === 'failed') setAutopilotRunning(false)
        if (data.event === 'log') setAutopilotRunning(true)
      } catch (_) {}
    }
    es.onerror = () => {}
    return () => {
      es.close()
    }
  }, [addSseEvent, setAutopilotRunning])

  const refreshDashboard = () => {
    fetch(`${API}/stats/dashboard`)
      .then((r) => r.json())
      .then((d) => {
        setDashboard(d)
        setDashboardStore(d)
      })
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Autopilot i pregled outreacha</p>
        </div>
        <AutopilotToggle onStart={refreshDashboard} />
      </div>

      <StatsCards data={dashboard} />
      <StartupStatusCard accounts={dashboard?.accounts} />

      <div className="grid lg:grid-cols-2 gap-6">
        <AiDecisionCard lastRun={dashboard?.lastRun} />
        <DomainCards accounts={dashboard?.accounts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity (real-time)</CardTitle>
        </CardHeader>
        <ActivityFeed />
      </Card>
    </div>
  )
}
