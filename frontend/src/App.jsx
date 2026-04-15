import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StudyPlan from './pages/StudyPlan'
import Predictions from './pages/Predictions'
import PredictionDetail from './pages/PredictionDetail'
import AccuracyReports from './pages/AccuracyReports'
import AccuracyDetail from './pages/AccuracyDetail'
import Community from './pages/Community'
import CommunityProfile from './pages/CommunityProfile'
import AITutor from './pages/AITutor'
import ProvaDay from './pages/ProvaDay'
import Premium from './pages/Premium'
import Admin from './pages/Admin'
import Simulado from './pages/Simulado'
import RadarElite from './pages/RadarElite'
import GPSAprovacao from './pages/GPSAprovacao'
import MapaMentalIA from './pages/MapaMentalIA'
import Settings from './pages/Settings'
import Privacy from './pages/Privacy'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(prev => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="page-wrapper" onClick={() => { if (sidebarOpen) closeSidebar() }}>
        <Routes>
          <Route path="/" element={<Dashboard onMenuClick={toggleSidebar} />} />
          <Route path="/plano" element={<StudyPlan onMenuClick={toggleSidebar} />} />
          <Route path="/predicoes" element={<Predictions onMenuClick={toggleSidebar} />} />
          <Route path="/predicoes/:banca/:materia" element={<PredictionDetail onMenuClick={toggleSidebar} />} />
          <Route path="/acuracia" element={<AccuracyReports onMenuClick={toggleSidebar} />} />
          <Route path="/acuracia/:id" element={<AccuracyDetail onMenuClick={toggleSidebar} />} />
          <Route path="/comunidade" element={<Community onMenuClick={toggleSidebar} />} />
          <Route path="/comunidade/perfil/:id" element={<CommunityProfile onMenuClick={toggleSidebar} />} />
          <Route path="/tutor" element={<AITutor onMenuClick={toggleSidebar} />} />
          <Route path="/prova-day" element={<ProvaDay onMenuClick={toggleSidebar} />} />
          <Route path="/premium" element={<Premium onMenuClick={toggleSidebar} />} />
          <Route path="/admin" element={<Admin onMenuClick={toggleSidebar} />} />
          <Route path="/simulado" element={<Simulado onMenuClick={toggleSidebar} />} />
          <Route path="/radar" element={<RadarElite onMenuClick={toggleSidebar} />} />
          <Route path="/gps" element={<GPSAprovacao onMenuClick={toggleSidebar} />} />
          <Route path="/mapa-mental" element={<MapaMentalIA onMenuClick={toggleSidebar} />} />
          <Route path="/configuracoes" element={<Settings onMenuClick={toggleSidebar} />} />
          <Route path="/privacidade" element={<Privacy onMenuClick={toggleSidebar} />} />
        </Routes>
      </main>
    </div>
  )
}
