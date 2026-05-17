import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getOverview, getHubHealth,
  getStackedByArea, getStackedByTeam, getStackedByCreator,
  getResolvedBySpecialist, getMonthlyStacked, getWeeklyStacked,
  getBacklogAge,
} from '../api'
import HubHealthBar    from '../components/HubHealthBar'
import DashboardFilters from '../components/DashboardFilters'
import StackedBarChart  from '../components/charts/StackedBarChart'
import StackedColumnChart from '../components/charts/StackedColumnChart'
import BacklogAgeChart  from '../components/charts/BacklogAgeChart'

const EXCLUDED = new Set(['Dheera Sameera', 'Pooja V', 'Suresh Karthik'])

function useRefetch(fn, set, onErr, deps) {
  const ref = useRef(0)
  useEffect(() => {
    const id = ++ref.current
    fn().then((d) => { if (id === ref.current) set(d) }).catch(onErr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

const INIT_FILTERS = { assigned_to: '', team: '', area: '', sub_category: '' }

export default function DashboardPage({ sessionId, onSessionExpired }) {
  const [overview,    setOverview]    = useState(null)
  const [hubHealth,   setHubHealth]   = useState(null)
  const [byArea,      setByArea]      = useState({ rows: [], sub_categories: [] })
  const [byTeam,      setByTeam]      = useState({ rows: [], sub_categories: [] })
  const [byCreator,   setByCreator]   = useState({ rows: [], sub_categories: [] })
  const [bySpecialist,setBySpecialist]= useState({ rows: [], sub_categories: [] })
  const [monthly,     setMonthly]     = useState({ rows: [], sub_categories: [] })
  const [inflow,      setInflow]      = useState({ rows: [], sub_categories: [] })
  const [outflow,     setOutflow]     = useState({ rows: [], sub_categories: [] })
  const [backlogAge,  setBacklogAge]  = useState([])

  const [filters, setFilters] = useState(INIT_FILTERS)
  const [range,   setRange]   = useState({ from: '', to: '' })

  const onErr = useCallback((err) => { if (err.sessionExpired) onSessionExpired() }, [onSessionExpired])

  const onFilter = useCallback((key, val) => {
    if (key === '__reset__') { setFilters(INIT_FILTERS); return }
    setFilters((f) => ({ ...f, [key]: val }))
  }, [])

  // One-time / filter-independent
  useEffect(() => {
    getOverview(sessionId).then(setOverview).catch(onErr)
    getBacklogAge(sessionId).then(setBacklogAge).catch(onErr)
  }, [sessionId, onErr])

  // Filter-sensitive fetches
  const fDeps = [range.from, range.to, JSON.stringify(filters)]

  useRefetch(() => getHubHealth(sessionId, range.from, range.to, filters),           setHubHealth,    onErr, fDeps)
  useRefetch(() => getStackedByArea(sessionId, range.from, range.to, filters),       setByArea,       onErr, fDeps)
  useRefetch(() => getStackedByTeam(sessionId, range.from, range.to, filters),       setByTeam,       onErr, fDeps)
  useRefetch(() => getStackedByCreator(sessionId, range.from, range.to, filters, 20),setByCreator,    onErr, fDeps)
  useRefetch(() => getResolvedBySpecialist(sessionId, range.from, range.to, filters),setBySpecialist, onErr, fDeps)
  useRefetch(() => getMonthlyStacked(sessionId, range.from, range.to, filters),      setMonthly,      onErr, fDeps)
  useRefetch(() => getWeeklyStacked(sessionId, 'created_date', range.from, range.to, filters),setInflow, onErr, fDeps)
  useRefetch(() => getWeeklyStacked(sessionId, 'closed_date',  range.from, range.to, filters),setOutflow,onErr, fDeps)

  const resolvedCount = hubHealth?.resolved    ?? 0
  const totalAll      = hubHealth?.total       ?? overview?.total_all ?? 0
  const inPipeline    = hubHealth?.in_pipeline ?? overview?.total_active ?? 0
  const uniqueTickets = hubHealth?.unique      ?? totalAll
  const dependency    = hubHealth?.dependency  ?? 0
  const overdueSla    = overview?.overdue_sla  ?? 0
  const due5          = overview?.due_within_5 ?? 0
  const avgAge        = overview?.avg_age      ?? 0

  return (
    <div className="space-y-5">

      {/* ── Global filters ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <DashboardFilters
          overview={overview}
          filters={filters}
          range={range}
          onFilter={onFilter}
          onRange={setRange}
        />
      </div>

      {/* ── Hub Health ── */}
      <Card title="Hub Health" accent="#1d4ed8">
        <HubHealthBar data={hubHealth} />
      </Card>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiTile label="Total Tickets"  value={totalAll}      wide />
        <KpiTile label="Resolved"       value={resolvedCount} color="#059669" />
        <KpiTile label="Unique Tickets" value={uniqueTickets} />
        <KpiTile label="In Pipeline"    value={inPipeline}    color="#3b82f6" />
        <KpiTile label="Dependency"     value={dependency}    color="#f59e0b" />
        <KpiTile label="Overdue SLA"    value={overdueSla}    color={overdueSla > 0 ? '#ef4444' : '#059669'} />
        <KpiTile label="Due ≤ 5d"       value={due5}          color={due5 > 0 ? '#f97316' : '#059669'} />
        <KpiTile label="Avg Age"        value={`${avgAge}d`}  />
      </div>

      {/* ── Row: By Area + By Team ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Tickets by Area" subtitle="All tickets · stacked by sub-category" accent="#1d4ed8">
          <StackedBarChart data={byArea} dimKey="area" />
        </Card>
        <Card title="Tickets by Team" subtitle="All tickets · stacked by sub-category" accent="#d97706">
          <StackedBarChart data={byTeam} dimKey="team" />
        </Card>
      </div>

      {/* ── Resolved by Specialist ── */}
      <Card title="Resolved by Specialist" subtitle="Closed tickets per team member · stacked by sub-category" accent="#059669">
        <StackedBarChart
          data={{
            ...bySpecialist,
            rows: bySpecialist.rows.filter((r) => !EXCLUDED.has(r.assigned_to)),
          }}
          dimKey="assigned_to"
        />
      </Card>

      {/* ── Tickets by Requestor ── */}
      <Card title="Tickets by Requestor" subtitle="Top 20 ticket creators · stacked by sub-category" accent="#7c3aed">
        <StackedBarChart data={byCreator} dimKey="ticket_creator" />
      </Card>

      {/* ── Monthly Inflow Trend ── */}
      <Card title="Ticket Inflow Trend — Month Wise" subtitle="All ticket creation over time · stacked by sub-category" accent="#0891b2">
        <StackedColumnChart data={monthly} xKey="label" height={320} />
      </Card>

      {/* ── Weekly Inflow + Outflow ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Weekly Ticket Inflow" subtitle="Created tickets · last 26 weeks · stacked by sub-category" accent="#6366f1">
          <StackedColumnChart data={inflow} xKey="label" height={300} />
        </Card>
        <Card title="Weekly Ticket Outflow" subtitle="Closed tickets · last 26 weeks · stacked by sub-category" accent="#059669">
          <StackedColumnChart data={outflow} xKey="label" height={300} />
        </Card>
      </div>

      {/* ── Backlog Age ── */}
      <Card title="Days Since Ticket Created" subtitle="Age distribution of active (open) tickets" accent="#ef4444">
        <BacklogAgeChart data={backlogAge} />
      </Card>

    </div>
  )
}

// ── Card shell ─────────────────────────────────────────────────────────────────

function Card({ title, subtitle, accent = '#6366f1', children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── KPI tile ───────────────────────────────────────────────────────────────────

function KpiTile({ label, value, color = '#374151', wide = false }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1 ${wide ? 'col-span-2 sm:col-span-2' : ''}`}>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-tight">{label}</p>
      <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value ?? '—'}</p>
    </div>
  )
}
