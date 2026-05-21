import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { getBandwidth, updateBandwidthRates } from '../api'

const WEEK_DAYS = 5

const STATUS = {
  Available:  { color: '#1e8a5e', bg: '#ecfdf5', border: '#6ee7b7', bar: '#1e8a5e' },
  Busy:       { color: '#b87d00', bg: '#fffbeb', border: '#fcd34d', bar: '#f59e0b' },
  Overloaded: { color: '#c0305a', bg: '#fff1f2', border: '#fda4af', bar: '#c0305a' },
}

/* ── small helpers ─────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.Available
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: cfg.color,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>{status}</span>
  )
}

function SlaChip({ label, count, color, bg, border }) {
  if (!count) return null
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color, background: bg,
      border: `1px solid ${border}`, borderRadius: 12,
      padding: '2px 7px', whiteSpace: 'nowrap',
    }}>{count} {label}</span>
  )
}

function PressureBar({ pct }) {
  const capped  = Math.min(pct, 100)
  const color   = pct >= 100 ? STATUS.Overloaded.bar : pct >= 70 ? STATUS.Busy.bar : STATUS.Available.bar
  const display = pct > 999 ? '>999' : pct
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: 8, background: '#f0f3fa', borderRadius: 4, overflow: 'hidden', minWidth: 80 }}>
        <div style={{ height: '100%', width: `${capped}%`, borderRadius: 4, background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 46, textAlign: 'right' }}>{display}%</span>
    </div>
  )
}

function StatCard({ label, value, sub, color, bg }) {
  return (
    <div style={{
      background: bg || '#fff', border: '1px solid #e5e8ef', borderRadius: 12,
      padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130,
    }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: color || '#111827', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</span>}
    </div>
  )
}

/* ── Rate-editing modal ─────────────────────────────────────────────── */

function RatesModal({ rates, onSave, onClose }) {
  const [local, setLocal] = useState(() =>
    Object.entries(rates).map(([k, v]) => ({ key: k, val: String(v) }))
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const parsed = Object.fromEntries(local.map(r => [r.key, parseFloat(r.val) || 1]))
    setSaving(true)
    await onSave(parsed)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 500, maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px 28px 24px',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          Ticket Effort Estimates
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
          Working days needed to complete one ticket of each type.
          Used to calculate SLA pressure and capacity headroom.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {local.map((row, i) => {
            const days  = parseFloat(row.val) || 1
            const weeks = (days / WEEK_DAYS).toFixed(1)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{row.key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number" step="0.5" min="0.5"
                    value={row.val}
                    onChange={e => setLocal(l => l.map((r, j) => j === i ? { ...r, val: e.target.value } : r))}
                    style={{
                      width: 72, height: 34, border: '1px solid #e5e7eb', borderRadius: 8,
                      fontSize: 13, textAlign: 'center', fontFamily: 'Inter, sans-serif',
                      color: '#111827', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>days/ticket</span>
                  <span style={{ fontSize: 11, color: '#d1d5db' }}>≈ {weeks} wk</span>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 13, color: '#6b7280', cursor: 'pointer', padding: '8px 16px',
            fontFamily: 'Inter, sans-serif',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            background: '#1450f5', color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 20px',
            fontFamily: 'Inter, sans-serif', opacity: saving ? 0.7 : 1,
          }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

/* ── Custom chart tooltip ───────────────────────────────────────────── */

const PressureTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>{d?.fullName}</div>
      <div style={{ color: '#6b7280' }}>SLA pressure: <strong style={{ color: d?.color }}>{d?.pressure}%</strong></div>
      <div style={{ color: '#6b7280' }}>Committed: <strong>{d?.committed}d</strong></div>
      {d?.breaching > 0 && <div style={{ color: '#c0305a', marginTop: 4 }}>⚠ {d.breaching} breaching SLA</div>}
      {d?.atRisk    > 0 && <div style={{ color: '#b87d00' }}>⚡ {d.atRisk} at risk</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════════════════ */

export default function BandwidthPage({ sessionId, onSessionExpired }) {
  const [bw, setBw]               = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showRates, setShowRates] = useState(false)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function load() {
    setLoading(true)
    getBandwidth(sessionId)
      .then(setBw)
      .catch(err => { if (err.sessionExpired) onSessionExpired?.() })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [sessionId])

  async function handleSaveRates(rates) {
    await updateBandwidthRates(rates)
    load()
  }

  const members = bw?.members ?? []

  const filtered = useMemo(() => {
    let rows = members
    if (search)       rows = rows.filter(r => r.assigned_to.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) rows = rows.filter(r => r.status === statusFilter)
    return rows
  }, [members, search, statusFilter])

  const stats = useMemo(() => {
    if (!members.length) return {}
    const avgPressure    = Math.round(members.reduce((s, m) => s + m.sla_pressure_pct, 0) / members.length)
    const totalBreaching = members.reduce((s, m) => s + m.sla_breaching, 0)
    const totalAtRisk    = members.reduce((s, m) => s + m.sla_at_risk, 0)
    return {
      total: members.length, avgPressure, totalBreaching, totalAtRisk,
      available:  members.filter(m => m.status === 'Available').length,
      busy:       members.filter(m => m.status === 'Busy').length,
      overloaded: members.filter(m => m.status === 'Overloaded').length,
    }
  }, [members])

  /* Chart — SLA pressure bar per specialist */
  const chartData = useMemo(() =>
    filtered.slice(0, 20).map(m => ({
      name:      m.assigned_to.split(' ')[0],
      fullName:  m.assigned_to,
      pressure:  m.sla_pressure_pct,
      committed: m.committed_days,
      breaching: m.sla_breaching,
      atRisk:    m.sla_at_risk,
      status:    m.status,
      color:     STATUS[m.status]?.bar || STATUS.Available.bar,
    }))
  , [filtered])

  /* Rate reference rows */
  const rateRows = useMemo(() =>
    Object.entries(bw?.rates ?? {}).map(([sc, days]) => ({
      sc, days, weeks: (days / WEEK_DAYS).toFixed(1),
    }))
  , [bw])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>Calculating bandwidth…</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Bandwidth Tracker</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            SLA-driven capacity — pressure = Σ(days effort ÷ working days to SLA deadline) per specialist.
            100 % = just-deliverable on time · above 100 % = deliveries will slip.
          </p>
        </div>
        <button
          onClick={() => setShowRates(true)}
          style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#374151',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0,
          }}
        >⚙ Edit Effort Estimates</button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard label="Specialists"     value={stats.total}          sub="with active tickets" />
        <StatCard
          label="Avg SLA Pressure" value={`${stats.avgPressure ?? 0}%`} sub="across all specialists"
          color={stats.avgPressure >= 100 ? '#c0305a' : stats.avgPressure >= 70 ? '#b87d00' : '#1e8a5e'}
          bg={stats.avgPressure >= 100 ? '#fff1f2' : stats.avgPressure >= 70 ? '#fffbeb' : '#ecfdf5'}
        />
        <StatCard label="SLA Breaching"  value={stats.totalBreaching ?? 0} sub="tickets past capacity" color="#c0305a" bg="#fff1f2" />
        <StatCard label="At Risk"         value={stats.totalAtRisk ?? 0}    sub="tight SLA windows"    color="#b87d00" bg="#fffbeb" />
        <StatCard label="Available"       value={stats.available ?? 0}      sub="< 70% pressure"       color="#1e8a5e" bg="#ecfdf5" />
        <StatCard label="Busy"            value={stats.busy ?? 0}           sub="70–99% pressure"      color="#b87d00" bg="#fffbeb" />
        <StatCard label="Overloaded"      value={stats.overloaded ?? 0}     sub="≥ 100% pressure"      color="#c0305a" bg="#fff1f2" />
      </div>

      {/* ── SLA pressure chart ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e8ef', padding: '20px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>SLA Pressure per Specialist</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          100 % = just-manageable · dashed red line = overload threshold
        </div>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 70, left: 8, bottom: 0 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, Math.max(100, ...chartData.map(d => d.pressure))]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category" dataKey="name"
              tick={{ fontSize: 11, fill: '#374151' }}
              axisLine={false} tickLine={false} width={70}
            />
            <Tooltip content={<PressureTooltip />} cursor={{ fill: '#f0f3fa' }} />
            <ReferenceLine
              x={100} stroke="#c0305a" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: '100%', position: 'right', fontSize: 10, fill: '#c0305a' }}
            />
            <Bar dataKey="pressure" name="SLA Pressure" radius={[0, 4, 4, 0]}>
              {chartData.map(e => <Cell key={e.fullName} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Effort reference card ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Ticket Effort Estimates</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {rateRows.map(({ sc, days, weeks }) => (
            <div key={sc} style={{
              background: '#f9fafb', border: '1px solid #e5e8ef', borderRadius: 8,
              padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{sc}</span>
              <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                <span style={{ color: '#1450f5', fontWeight: 700 }}>{days} days/ticket</span>
                <span style={{ color: '#9ca3af' }}>≈ {weeks} wk</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        background: '#fff', border: '1px solid #e5e8ef', borderRadius: 12,
        padding: '14px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search specialist…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              paddingLeft: 30, paddingRight: 10, height: 34, border: '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 13, color: '#374151', outline: 'none',
              fontFamily: 'Inter, sans-serif', width: 190,
            }}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{
            height: 34, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13,
            color: '#374151', padding: '0 10px', background: '#fff',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', minWidth: 140,
          }}
        >
          <option value="">All Statuses</option>
          {['Available', 'Busy', 'Overloaded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter('') }} style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 12, color: '#6b7280', cursor: 'pointer', padding: '0 10px', height: 34,
            fontFamily: 'Inter, sans-serif',
          }}>Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
          {filtered.length} of {members.length} specialists
        </span>
      </div>

      {/* ── Main table ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e8ef', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {[
                  'Specialist', 'Tickets', 'Breakdown',
                  'Committed Days', 'SLA Pressure', 'SLA Health',
                  'Avail. Days', 'Can Take', 'Status',
                ].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6b7280',
                    borderBottom: '2px solid #e5e8ef', textAlign: 'left', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                    No specialists found.
                  </td>
                </tr>
              ) : filtered.map((m, i) => (
                <tr
                  key={m.assigned_to}
                  style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f3fa' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                >
                  {/* Specialist */}
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${Math.abs(m.assigned_to.charCodeAt(0) * 37) % 360},55%,88%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#374151',
                      }}>
                        {m.assigned_to.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {m.assigned_to}
                    </div>
                  </td>

                  {/* Tickets */}
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#1450f5', fontSize: 15 }}>{m.active_tickets}</span>
                    {m.untracked_tickets > 0 && (
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{m.untracked_tickets} untracked</div>
                    )}
                  </td>

                  {/* Breakdown */}
                  <td style={{ padding: '10px 14px', minWidth: 180 }}>
                    {!Object.keys(m.ticket_breakdown).length ? (
                      <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {Object.entries(m.ticket_breakdown).map(([sc, cnt]) => (
                          <div key={sc} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#6b7280', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{sc}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', background: '#f0f3fa', borderRadius: 4, padding: '1px 5px' }}>{cnt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Committed days */}
                  <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{m.committed_days}d</span>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>
                      {(m.committed_days / WEEK_DAYS).toFixed(1)} wk of work
                    </div>
                  </td>

                  {/* SLA Pressure */}
                  <td style={{ padding: '10px 14px', minWidth: 160 }}>
                    <PressureBar pct={m.sla_pressure_pct} />
                  </td>

                  {/* SLA Health */}
                  <td style={{ padding: '10px 14px', minWidth: 160 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                      <SlaChip label="breach"  count={m.sla_breaching} color="#c0305a" bg="#fff1f2" border="#fda4af" />
                      <SlaChip label="at risk" count={m.sla_at_risk}   color="#b87d00" bg="#fffbeb" border="#fcd34d" />
                      <SlaChip label="safe"    count={m.sla_safe}      color="#1e8a5e" bg="#ecfdf5" border="#6ee7b7" />
                    </div>
                    {/* Nearest SLA per type */}
                    {(m.sla_details ?? []).map(d => d.min_working_days_to_sla !== null && (
                      <div key={d.sub_category} style={{ fontSize: 10, color: '#9ca3af', display: 'flex', gap: 4, marginTop: 2 }}>
                        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.sub_category}
                        </span>
                        <span>→</span>
                        <span style={{
                          fontWeight: 700,
                          color: d.min_working_days_to_sla <= 0     ? '#c0305a'
                               : d.min_working_days_to_sla < d.days_per_ticket ? '#c0305a'
                               : d.min_working_days_to_sla < d.days_per_ticket * 1.5 ? '#b87d00'
                               : '#1e8a5e',
                        }}>
                          {d.min_working_days_to_sla <= 0
                            ? 'overdue'
                            : `${d.min_working_days_to_sla}wd left`}
                        </span>
                      </div>
                    ))}
                  </td>

                  {/* Available days */}
                  <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontWeight: 700,
                      color: m.available_days > 2 ? '#1e8a5e' : m.available_days > 0 ? '#b87d00' : '#c0305a',
                    }}>
                      {m.available_days}d
                    </span>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>of {WEEK_DAYS}d week</div>
                  </td>

                  {/* Can take */}
                  <td style={{ padding: '10px 14px', minWidth: 160 }}>
                    {m.available_days <= 0 ? (
                      <span style={{ fontSize: 12, color: '#c0305a', fontWeight: 600 }}>At capacity</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Object.entries(m.capacity_by_type ?? {})
                          .filter(([, v]) => v > 0)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([sc, n]) => (
                            <div key={sc} style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontSize: 10, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{sc}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1e8a5e' }}>+{Math.floor(n)}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRates && (
        <RatesModal
          rates={bw?.rates ?? {}}
          onSave={handleSaveRates}
          onClose={() => setShowRates(false)}
        />
      )}
    </div>
  )
}
