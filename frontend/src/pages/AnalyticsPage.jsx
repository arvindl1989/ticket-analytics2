import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getOverview, getMonthlyCreated,
  getWeeklyComparison, getWeeklyByAssignee,
  getByArea, getByTeam, getByCreator,
  getInflowOutflow, getSlaPerformance, getResolutionTime,
  getTeamPerformance, getBacklogAge,
} from '../api'

import MonthlyChart        from '../components/charts/MonthlyChart'
import WeeklyChart         from '../components/charts/WeeklyChart'
import WeeklyAssigneeChart from '../components/charts/WeeklyAssigneeChart'
import AreaChartComp       from '../components/charts/AreaChart'
import TeamChart           from '../components/charts/TeamChart'
import CreatorChart        from '../components/charts/CreatorChart'
import InflowOutflowChart  from '../components/charts/InflowOutflowChart'
import SlaPerformanceChart from '../components/charts/SlaPerformanceChart'
import ResolutionTimeChart from '../components/charts/ResolutionTimeChart'
import TeamPerformanceTable from '../components/charts/TeamPerformanceTable'
import BacklogAgeChart     from '../components/charts/BacklogAgeChart'
import DateRangePicker     from '../components/DateRangePicker'
import ChartFilters        from '../components/ChartFilters'

// Names excluded from team performance view
const EXCLUDED_MEMBERS = new Set(['Dheera Sameera', 'Pooja V', 'Suresh Karthik'])

// Section accent colours — hex avoids Tailwind purge issues with dynamic class names
const COLOR = {
  indigo: '#6366f1',
  blue:   '#3b82f6',
  green:  '#10b981',
  amber:  '#f59e0b',
  red:    '#ef4444',
  violet: '#8b5cf6',
  pink:   '#ec4899',
  teal:   '#14b8a6',
  slate:  '#cbd5e1',
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useSection(dimKeys = []) {
  const [range,   setRange]   = useState({ from: '', to: '' })
  const [filters, setFilters] = useState(Object.fromEntries(dimKeys.map((k) => [k, ''])))
  return { range, setRange, filters, setFilters }
}

function useRefetch(fn, set, onErr, deps) {
  const ref = useRef(0)
  useEffect(() => {
    const id = ++ref.current
    fn().then((d) => { if (id === ref.current) set(d) }).catch(onErr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage({ sessionId, onSessionExpired }) {
  const [overview,      setOverview]      = useState(null)
  const [monthly,       setMonthly]       = useState([])
  const [weekly,        setWeekly]        = useState([])
  const [weeklyAss,     setWeeklyAss]     = useState({ weeks: [], assignees: [] })
  const [backlogAge,    setBacklogAge]    = useState([])
  const [teamPerfRange, setTeamPerfRange] = useState({ from: '', to: '' })

  const inflow    = useSection(['assigned_to', 'team', 'area', 'sub_category'])
  const slaperf   = useSection(['assigned_to', 'team', 'area', 'sub_category'])
  const restime   = useSection(['assigned_to', 'team', 'area', 'sub_category'])
  const byArea    = useSection(['team', 'sub_category', 'assigned_to'])
  const byTeam    = useSection(['area', 'sub_category', 'assigned_to'])
  const byCreator = useSection(['team', 'area', 'sub_category'])

  const [inflowData,    setInflowData]    = useState([])
  const [slaData,       setSlaData]       = useState([])
  const [resData,       setResData]       = useState(null)
  const [areaData,      setAreaData]      = useState([])
  const [teamData,      setTeamData]      = useState([])
  const [creatorData,   setCreatorData]   = useState([])
  const [teamPerf,      setTeamPerf]      = useState([])
  const [inflowGroupBy, setInflowGroupBy] = useState('week')
  const [areaView,      setAreaView]      = useState('bar')

  const onErr = useCallback((err) => { if (err.sessionExpired) onSessionExpired() }, [onSessionExpired])

  useEffect(() => {
    Promise.all([
      getOverview(sessionId), getMonthlyCreated(sessionId),
      getWeeklyComparison(sessionId), getWeeklyByAssignee(sessionId),
      getBacklogAge(sessionId),
    ]).then(([ov, mo, wk, wa, ba]) => {
      setOverview(ov); setMonthly(mo); setWeekly(wk); setWeeklyAss(wa); setBacklogAge(ba)
    }).catch(onErr)
  }, [sessionId, onErr])

  useRefetch(() => getTeamPerformance(sessionId, teamPerfRange.from, teamPerfRange.to),
    setTeamPerf, onErr, [teamPerfRange.from, teamPerfRange.to])

  useRefetch(() => getInflowOutflow(sessionId, inflow.range.from, inflow.range.to, inflowGroupBy, inflow.filters),
    setInflowData, onErr, [inflow.range.from, inflow.range.to, inflowGroupBy, JSON.stringify(inflow.filters)])

  useRefetch(() => getSlaPerformance(sessionId, slaperf.range.from, slaperf.range.to, slaperf.filters),
    setSlaData, onErr, [slaperf.range.from, slaperf.range.to, JSON.stringify(slaperf.filters)])

  useRefetch(() => getResolutionTime(sessionId, restime.range.from, restime.range.to, restime.filters),
    setResData, onErr, [restime.range.from, restime.range.to, JSON.stringify(restime.filters)])

  useRefetch(() => getByArea(sessionId, byArea.range.from, byArea.range.to, byArea.filters),
    setAreaData, onErr, [byArea.range.from, byArea.range.to, JSON.stringify(byArea.filters)])

  useRefetch(() => getByTeam(sessionId, byTeam.range.from, byTeam.range.to, byTeam.filters),
    setTeamData, onErr, [byTeam.range.from, byTeam.range.to, JSON.stringify(byTeam.filters)])

  useRefetch(() => getByCreator(sessionId, byCreator.range.from, byCreator.range.to, byCreator.filters),
    setCreatorData, onErr, [byCreator.range.from, byCreator.range.to, JSON.stringify(byCreator.filters)])

  // ── Derived KPIs ────────────────────────────────────────────────────────────
  const totalOnTime = slaData.reduce((s, d) => s + (d.closed_on_time || 0), 0)
  const totalClosed = slaData.reduce((s, d) => s + (d.total_closed  || 0), 0)
  const slaRate     = totalClosed > 0 ? Math.round(totalOnTime / totalClosed * 100) : null

  const resRows  = resData?.by_sub_category ?? []
  const resCases = resRows.reduce((s, r) => s + r.count, 0)
  const avgRes   = resCases > 0
    ? Math.round(resRows.reduce((s, r) => s + r.avg_days * r.count, 0) / resCases * 10) / 10
    : null

  const filteredTeamPerf = teamPerf.filter((r) => !EXCLUDED_MEMBERS.has(r.assigned_to))

  return (
    <div className="space-y-6 pb-16">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Executive overview · all figures based on uploaded data</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-1.5 text-sm print:hidden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* ── 1. KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="SLA Compliance"
          value={slaRate != null ? `${slaRate}%` : '—'}
          detail={totalClosed > 0 ? `${totalOnTime} of ${totalClosed} closed on time` : 'No closed tickets'}
          tier={slaRate == null ? 'neutral' : slaRate >= 80 ? 'good' : slaRate >= 60 ? 'warn' : 'bad'}
          icon={<CheckIcon />}
        />
        <KpiCard
          label="Active Tickets"
          value={overview?.total_active ?? '—'}
          detail={`${overview?.overdue_sla ?? 0} overdue · ${overview?.due_within_5 ?? 0} due ≤5d`}
          tier={overview?.overdue_sla > 0 ? 'warn' : 'good'}
          icon={<TicketIcon />}
        />
        <KpiCard
          label="SLA Breaches"
          value={overview?.overdue_sla ?? '—'}
          detail="active tickets past SLA date"
          tier={!overview?.overdue_sla ? 'good' : overview.overdue_sla > 10 ? 'bad' : 'warn'}
          icon={<AlertIcon />}
        />
        <KpiCard
          label="Avg Resolution"
          value={avgRes != null ? `${avgRes}d` : '—'}
          detail="calendar days · closed tickets"
          tier={avgRes == null ? 'neutral' : avgRes <= 10 ? 'good' : avgRes <= 20 ? 'warn' : 'bad'}
          icon={<ClockIcon />}
        />
      </div>

      {/* ── 2. Team Performance ── */}
      <Section
        color={COLOR.indigo}
        title="Team Performance"
        subtitle="Workload, SLA compliance and delivery speed per team member"
        controls={
          <DateRangePicker
            dateFrom={teamPerfRange.from}
            dateTo={teamPerfRange.to}
            onChange={(from, to) => setTeamPerfRange({ from, to })}
          />
        }
      >
        <TeamPerformanceTable data={filteredTeamPerf} />
      </Section>

      {/* ── 3. Inflow vs Outflow ── */}
      <Section
        color={COLOR.blue}
        title="Inflow vs Outflow"
        subtitle="Ticket creation vs resolution — positive net means backlog is growing"
        controls={
          <Controls>
            <TogglePill
              options={[['week','Weekly'],['month','Monthly']]}
              value={inflowGroupBy}
              onChange={setInflowGroupBy}
            />
            <ChartFilters show={['assigned_to','team','area','sub_category']}
              overview={overview} filters={inflow.filters} onChange={inflow.setFilters} />
            <DateRangePicker dateFrom={inflow.range.from} dateTo={inflow.range.to}
              onChange={(from, to) => inflow.setRange({ from, to })} />
          </Controls>
        }
      >
        <InflowOutflowChart data={inflowData} />
      </Section>

      {/* ── 4. SLA Compliance ── */}
      <Section
        color={COLOR.green}
        title="SLA Compliance by Sub-Category"
        subtitle="On-time vs late delivery for closed tickets · active breach status"
        controls={
          <Controls>
            <ChartFilters show={['assigned_to','team','area','sub_category']}
              overview={overview} filters={slaperf.filters} onChange={slaperf.setFilters} />
            <DateRangePicker dateFrom={slaperf.range.from} dateTo={slaperf.range.to}
              onChange={(from, to) => slaperf.setRange({ from, to })} />
          </Controls>
        }
      >
        <SlaPerformanceChart data={slaData} />
      </Section>

      {/* ── 5. Resolution Speed ── */}
      <Section
        color={COLOR.amber}
        title="Resolution Speed"
        subtitle="Average calendar days from creation to closure"
        controls={
          <Controls>
            <ChartFilters show={['assigned_to','team','area','sub_category']}
              overview={overview} filters={restime.filters} onChange={restime.setFilters} />
            <DateRangePicker dateFrom={restime.range.from} dateTo={restime.range.to}
              onChange={(from, to) => restime.setRange({ from, to })} />
          </Controls>
        }
      >
        <ResolutionTimeChart data={resData} />
      </Section>

      {/* ── 6. Backlog + Area (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section color={COLOR.red} title="Backlog Age" subtitle="How long active tickets have been open">
          <BacklogAgeChart data={backlogAge} />
        </Section>

        <Section
          color={COLOR.violet}
          title="Volume by Area"
          controls={
            <Controls>
              <TogglePill
                options={[['bar','Bar'],['pie','Pie']]}
                value={areaView}
                onChange={setAreaView}
              />
              <ChartFilters show={['team','sub_category']} overview={overview}
                filters={byArea.filters} onChange={byArea.setFilters} />
              <DateRangePicker dateFrom={byArea.range.from} dateTo={byArea.range.to}
                onChange={(from, to) => byArea.setRange({ from, to })} />
            </Controls>
          }
        >
          <AreaChartComp data={areaData} view={areaView} />
        </Section>
      </div>

      {/* ── 7. Volume by Team ── */}
      <Section
        color={COLOR.pink}
        title="Volume by Team"
        subtitle="Ticket creation split across business teams"
        controls={
          <Controls>
            <ChartFilters show={['area','sub_category']} overview={overview}
              filters={byTeam.filters} onChange={byTeam.setFilters} />
            <DateRangePicker dateFrom={byTeam.range.from} dateTo={byTeam.range.to}
              onChange={(from, to) => byTeam.setRange({ from, to })} />
          </Controls>
        }
      >
        <TeamChart data={teamData} />
      </Section>

      {/* ── 8. Volume by Requestor ── */}
      <Section
        color={COLOR.teal}
        title="Volume by Requestor"
        subtitle="Top ticket creators"
        controls={
          <Controls>
            <ChartFilters show={['team','area','sub_category']} overview={overview}
              filters={byCreator.filters} onChange={byCreator.setFilters} />
            <DateRangePicker dateFrom={byCreator.range.from} dateTo={byCreator.range.to}
              onChange={(from, to) => byCreator.setRange({ from, to })} />
          </Controls>
        }
      >
        <CreatorChart data={creatorData} limit={20} />
      </Section>

      {/* ── 9. Historical trends ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section color={COLOR.slate} title="Monthly Volume Trend" subtitle="All-time ticket creation by month">
          <MonthlyChart data={monthly} />
        </Section>
        <Section color={COLOR.slate} title="Weekly Created vs Closed" subtitle="All-time weekly flow">
          <WeeklyChart data={weekly} limit={weekly.length} />
        </Section>
      </div>

      {/* ── 10. Weekly by assignee ── */}
      <Section
        color={COLOR.slate}
        title="Weekly Created by Assignee"
        subtitle="Stacked — toggle individuals using the legend"
      >
        <WeeklyAssigneeChart data={weeklyAss} assignees={weeklyAss.assignees} limit={weeklyAss.weeks?.length} />
      </Section>
    </div>
  )
}

// ── Section card ───────────────────────────────────────────────────────────────

function Section({ color, title, subtitle, controls, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Coloured top strip */}
      <div className="h-[3px]" style={{ backgroundColor: color }} />

      {/* Header */}
      <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        {controls && <div className="flex-shrink-0">{controls}</div>}
      </div>

      {/* Body */}
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── KPI card ───────────────────────────────────────────────────────────────────

const TIER = {
  good:    { bar: '#10b981', val: '#065f46', bg: '#f0fdf4', border: '#a7f3d0' },
  warn:    { bar: '#f59e0b', val: '#78350f', bg: '#fffbeb', border: '#fde68a' },
  bad:     { bar: '#ef4444', val: '#7f1d1d', bg: '#fef2f2', border: '#fecaca' },
  neutral: { bar: '#6366f1', val: '#312e81', bg: '#eef2ff', border: '#c7d2fe' },
}

function KpiCard({ label, value, detail, tier = 'neutral', icon }) {
  const t = TIER[tier] ?? TIER.neutral
  return (
    <div className="rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: t.border, backgroundColor: t.bg }}>
      <div className="h-1" style={{ backgroundColor: t.bar }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{label}</p>
          <span className="text-gray-400 flex-shrink-0">{icon}</span>
        </div>
        <p className="text-3xl font-bold tracking-tight" style={{ color: t.val }}>{value}</p>
        <p className="text-xs text-gray-400 mt-2 leading-snug">{detail}</p>
      </div>
    </div>
  )
}

// ── Toolbar helpers ────────────────────────────────────────────────────────────

function Controls({ children }) {
  return <div className="flex flex-wrap gap-2 items-center">{children}</div>
}

function TogglePill({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 text-xs font-medium transition-colors
            ${value === v ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Minimal icons ──────────────────────────────────────────────────────────────

const CheckIcon  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
const TicketIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
const AlertIcon  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
const ClockIcon  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
