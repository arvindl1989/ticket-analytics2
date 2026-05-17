import { useState, useCallback } from 'react'
import UploadZone     from './components/UploadZone'
import DashboardPage  from './pages/DashboardPage'
import PriorityPage   from './pages/PriorityPage'
import AnalyticsPage  from './pages/AnalyticsPage'
import SlaConfigModal from './components/SlaConfigModal'

const TABS = [
  { id: 'dashboard', label: 'Dashboard',        icon: '▦' },
  { id: 'priority',  label: 'Priority Tracker',  icon: '⚑' },
  { id: 'analytics', label: 'Analytics',         icon: '◈' },
]

export default function App() {
  const [sessionId,  setSessionId]  = useState(() => localStorage.getItem('ticketSessionId'))
  const [uploadMeta, setUploadMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ticketMeta') || 'null') } catch { return null }
  })
  const [activeTab,     setActiveTab]     = useState('dashboard')
  const [showUpload,    setShowUpload]    = useState(false)
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AppHeader
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader
        filename={uploadMeta?.filename}
        totalRows={uploadMeta?.total_rows}
        onReupload={() => setShowUpload(true)}
        onSlaConfig={() => setShowSlaConfig(true)}
      />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 sm:px-6 py-5">
        <div className="max-w-screen-2xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage sessionId={sessionId} onSessionExpired={handleSessionExpired} />
          )}
          {activeTab === 'priority' && (
            <PriorityPage  sessionId={sessionId} onSessionExpired={handleSessionExpired} />
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

function AppHeader({ filename, totalRows, onReupload, onBack, onSlaConfig }) {
  return (
    <header className="bg-slate-900 text-white px-6 py-3 flex items-center gap-4 shadow-md flex-shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Logo mark */}
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">IQ</span>
        </div>
        <span className="text-base font-bold tracking-tight text-white">TicketIQ</span>

        {filename && (
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-sm truncate max-w-xs">{filename}</span>
            <span className="text-slate-600 text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {totalRows?.toLocaleString()} rows
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onSlaConfig}
          className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          SLA Config
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ← Back
          </button>
        )}
        {onReupload && (
          <button
            onClick={onReupload}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Upload New File
          </button>
        )}
      </div>
    </header>
  )
}
