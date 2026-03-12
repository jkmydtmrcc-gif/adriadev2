import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const API = '/api'
const COLORS = ['#7C6AF7', '#10D9A0', '#F5A623', '#FF4D6D', '#7878A0']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/stats/analytics`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary">Analytics</h1>
        <div className="h-64 rounded-xl bg-bg-elevated animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Statistike po statusu, industriji i gradu</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Po statusu</CardTitle>
          </CardHeader>
          {data?.byStatus?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {data.byStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text-muted text-sm py-8">Nema podataka</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top industrije</CardTitle>
          </CardHeader>
          {data?.byIndustry?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byIndustry} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" stroke="#7878A0" fontSize={12} />
                  <YAxis type="category" dataKey="industry" stroke="#7878A0" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7C6AF7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text-muted text-sm py-8">Nema podataka</p>
          )}
        </Card>
      </div>

      {data?.runsLast30?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zadnjih 30 dana — leadovi i emailovi</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.runsLast30}>
                <XAxis dataKey="day" stroke="#7878A0" fontSize={11} />
                <YAxis stroke="#7878A0" fontSize={11} />
                <Tooltip />
                <Bar dataKey="leads" fill="#7C6AF7" name="Leadovi" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emails" fill="#10D9A0" name="Emailovi" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  )
}
