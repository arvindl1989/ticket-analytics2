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
      <div style={{ background: '#ffffff', border: '1px solid #e8e3da', borderRadius: 16, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" style={{ gap: 12 }}>
        <KpiTile label="Total Tickets"  value={totalAll}        theme="total"    wide />
        <KpiTile label="Resolved"       value={resolvedCount}   theme="resolved" />
        <KpiTile label="Unique Tickets" value={uniqueTickets}   theme="unique"   />
        <KpiTile label="In Pipeline"    value={inPipeline}      theme="pipeline" />
        <KpiTile label="Dependency"     value={dependency}      theme="depend"   />
        <KpiTile label="Overdue SLA"    value={overdueSla}      theme={overdueSla > 0 ? 'overdue' : 'resolved'} />
        <KpiTile label="Due ≤ 5d"       value={due5}            theme={due5 > 0 ? 'due5' : 'resolved'} />
        <KpiTile label="Avg Age"        value={`${avgAge}d`}    theme="age"      />
      </div>

      {/* ── Row: By Area + By Team ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Tickets by Area" subtitle="All tickets · stacked by sub-category" accent="#1450f5">
          <StackedBarChart data={byArea} dimKey="area" />
        </Card>
        <Card title="Tickets by Team" subtitle="All tickets · stacked by sub-category" accent="#b87d00">
          <StackedBarChart data={byTeam} dimKey="team" />
        </Card>
      </div>

      {/* ── Resolved by Specialist ── */}
      <Card title="Resolved by Specialist" subtitle="Closed tickets per team member · stacked by sub-category" accent="#1e8a5e">
        <StackedBarChart
          data={{
            ...bySpecialist,
            rows: bySpecialist.rows.filter((r) => !EXCLUDED.has(r.assigned_to)),
          }}
          dimKey="assigned_to"
        />
      </Card>

      {/* ── Tickets by Requestor ── */}
      <Card title="Tickets by Requestor" subtitle="Top 20 ticket creators · stacked by sub-category" accent="#c0305a">
        <StackedBarChart data={byCreator} dimKey="ticket_creator" />
      </Card>

      {/* ── Monthly Inflow Trend ── */}
      <Card title="Ticket Inflow Trend — Month Wise" subtitle="All ticket creation over time · stacked by sub-category" accent="#0077a8">
        <StackedColumnChart data={monthly} xKey="label" height={320} />
      </Card>

      {/* ── Weekly Inflow + Outflow ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Weekly Ticket Inflow" subtitle="Created tickets · last 26 weeks · stacked by sub-category" accent="#1450f5">
          <StackedColumnChart data={inflow} xKey="label" height={300} />
        </Card>
        <Card title="Weekly Ticket Outflow" subtitle="Closed tickets · last 26 weeks · stacked by sub-category" accent="#1e8a5e">
          <StackedColumnChart data={outflow} xKey="label" height={300} />
        </Card>
      </div>

      {/* ── Backlog Age ── */}
      <Card title="Days Since Ticket Created" subtitle="Age distribution of active (open) tickets" accent="#c0305a">
        <BacklogAgeChart data={backlogAge} />
      </Card>

    </div>
  )
}

// ── Card shell ─────────────────────────────────────────────────────────────────

function Card({ title, subtitle, accent = '#1450f5', controls, children }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid #e8e3da',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ height: 4, background: accent, borderRadius: '16px 16px 0 0' }} />
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #ede8e0',
        background: '#faf8f5',
        display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#141414', lineHeight: 1.3, margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>{subtitle}</p>}
          </div>
        </div>
        {controls && <div style={{ flexShrink: 0 }}>{controls}</div>}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

// ── KPI tile ───────────────────────────────────────────────────────────────────

const TILE_CONFIG = {
  total:    { bg: '#d2f5ff', numColor: '#141414' },
  resolved: { bg: '#aae1c8', numColor: '#141414' },
  unique:   { bg: '#ffffff', numColor: '#141414' },
  pipeline: { bg: '#d2f5ff', numColor: '#1450f5' },
  depend:   { bg: '#ffe141', numColor: '#141414' },
  overdue:  { bg: '#ffcdd7', numColor: '#141414' },
  due5:     { bg: '#ffe141', numColor: '#141414' },
  age:      { bg: '#f3eee6', numColor: '#141414' },
}

function KpiTile({ label, value, theme = 'unique', wide = false }) {
  const t = TILE_CONFIG[theme] ?? TILE_CONFIG.unique
  return (
    <div style={{
      backgroundColor: t.bg,
      borderRadius: 14,
      border: '1px solid rgba(0,0,0,0.07)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
      gridColumn: wide ? 'span 2' : 'span 1',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: 38, fontWeight: 800, color: t.numColor, lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>
        {value ?? '—'}
      </p>
    </div>
  )
}
