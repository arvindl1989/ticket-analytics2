import { useState, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import DashboardPage from './pages/DashboardPage'
import PriorityPage from './pages/PriorityPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SlaConfigModal from './components/SlaConfigModal'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'priority', label: 'Priority Tracker' },
  { id: 'analytics', label: 'Analytics' },
]

export default function App() {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('ticketSessionId'))
  const [uploadMeta, setUploadMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ticketMeta') || 'null') } catch { return null }
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showUpload, setShowUpload] = useState(false)
  const [showSlaConfig, setShowSlaConfig] = useState(false)

  const handleUpload = useCallback((result) => {
    localStorage.setItem('ticketSessionId', result.session_id)
    localStorage.setItem('ticketMeta', JSON.stringify(result))
    setSessionId(result.session_id)
    setUploadMeta(result)
    setShowUpload(false)
    setActiveTab('dashboard')
  }, [])

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('ticketSessionId')
    localStorage.removeItem('ticketMeta')
    setSessionId(null)
    setUploadMeta(null)
  }, [])

  if (!sessionId || showUpload) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          hasSession={!!sessionId}
          onBack={sessionId ? () => setShowUpload(false) : null}
          onSlaConfig={() => setShowSlaConfig(true)}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <UploadZone onUpload={handleUpload} />
        </main>
        {showSlaConfig && <SlaConfigModal onClose={() => setShowSlaConfig(false)} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        filename={uploadMeta?.filename}
        totalRows={uploadMeta?.total_rows}
        onReupload={() => setShowUpload(true)}
        onSlaConfig={() => setShowSlaConfig(true)}
      />

      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-screen-2xl mx-auto flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6">
        <div className="max-w-screen-2xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage sessionId={sessionId} onSessionExpired={handleSessionExpired} />
          )}
          {activeTab === 'priority' && (
            <PriorityPage sessionId={sessionId} onSessionExpired={handleSessionExpired} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsPage sessionId={sessionId} onSessionExpired={handleSessionExpired} />
          )}
        </div>
      </main>

      {showSlaConfig && <SlaConfigModal onClose={() => setShowSlaConfig(false)} />}
    </div>
  )
}

function Header({ filename, totalRows, onReupload, onBack, onSlaConfig, hasSession }) {
  return (
    <header className="bg-indigo-700 text-white px-6 py-3 flex items-center gap-4 shadow-md">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xl font-bold tracking-tight">TicketIQ</span>
        {filename && (
          <span className="text-indigo-200 text-sm ml-3">
            {filename} · {totalRows?.toLocaleString()} rows
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onSlaConfig} className="text-indigo-200 hover:text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-600 transition-colors">
          SLA Config
        </button>
        {onBack && (
          <button onClick={onBack} className="btn-secondary text-sm">
            ← Back
          </button>
        )}
        {onReupload && (
          <button onClick={onReupload} className="bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
            Upload New File
          </button>
        )}
      </div>
    </header>
  )
}
