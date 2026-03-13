import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/Toaster'
import AuthGuard from './components/AuthGuard'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import WhatsApp from './pages/WhatsApp'
import AutopilotLog from './pages/AutopilotLog'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Racuni from './pages/Racuni'
import RacuniNovi from './pages/RacuniNovi'
import RacuniPostavke from './pages/RacuniPostavke'
import Klijenti from './pages/Klijenti'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <AuthGuard>
        <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/autopilot-log" element={<AutopilotLog />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/racuni" element={<Racuni />} />
          <Route path="/racuni/novi" element={<RacuniNovi />} />
          <Route path="/racuni/postavke" element={<RacuniPostavke />} />
          <Route path="/klijenti" element={<Klijenti />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </AuthGuard>
    </BrowserRouter>
  )
}
