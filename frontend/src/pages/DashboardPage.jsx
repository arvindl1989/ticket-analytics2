import { useEffect, useState } from 'react'
import { getOverview, getMonthlyCreated, getWeeklyComparison } from '../api'
import SummaryCards from '../components/SummaryCards'
import MonthlyChart from '../components/charts/MonthlyChart'
import WeeklyChart from '../components/charts/WeeklyChart'

export default function DashboardPage({ sessionId, onSessionExpired }) {
  const [overview, setOverview] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [weekly, setWeekly] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getOverview(sessionId),
      getMonthlyCreated(sessionId),
      getWeeklyComparison(sessionId),
    ])
      .then(([ov, mo, wk]) => {
        setOverview(ov)
        setMonthly(mo)
        setWeekly(wk)
      })
      .catch((err) => {
        if (err.sessionExpired) onSessionExpired()
        else setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [sessionId, onSessionExpired])

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  const overduePct = overview?.total_active
    ? Math.round((overview.overdue_sla / overview.total_active) * 100)
    : 0

  return (
    <div className="space-y-6">
      <SummaryCards data={overview} />

      {/* SLA health banner */}
      {overview?.overdue_sla > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-sm text-red-700">
            <span className="font-semibold">{overview.overdue_sla} ticket{overview.overdue_sla !== 1 ? 's' : ''}</span>
            {' '}have breached SLA ({overduePct}% of active). Switch to the{' '}
            <span className="font-semibold">Priority Tracker</span> to take action.
          </p>
        </div>
      )}

      {/* Team workload snapshot */}
      {overview?.assigned_to_list?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Team SLA Status</h3>
          <TeamStatusTable sessionId={sessionId} assignees={overview.assigned_to_list} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Tickets Created Per Month</h3>
          <MonthlyChart data={monthly} />
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-1">Weekly Created vs Closed</h3>
          <p className="text-xs text-gray-400 mb-4">Last 26 weeks</p>
          <WeeklyChart data={weekly} limit={26} />
        </div>
      </div>
    </div>
  )
}

function TeamStatusTable({ sessionId, assignees }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    import('../api').then(({ getPriority }) => {
      Promise.all(
        assignees.map((a) =>
          getPriority(sessionId, { assigned_to: a, limit: 200 }).then((tickets) => {
            const overdue = tickets.filter((t) => t.priority_label === 'Overdue').length
            const critical = tickets.filter((t) => t.priority_label === 'Critical').length
            const high = tickets.filter((t) => t.priority_label === 'High').length
            return { name: a, total: tickets.length, overdue, critical, high }
          })
        )
      ).then(setRows)
    })
  }, [sessionId, assignees])

  if (!rows.length) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Assignee', 'Active', 'Overdue', 'Critical', 'High'].map((h) => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows
            .sort((a, b) => b.overdue - a.overdue || b.critical - a.critical || b.total - a.total)
            .map((r) => (
              <tr key={r.name} className="hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{r.name}</td>
                <td className="py-2 px-3 text-gray-600">{r.total}</td>
                <td className="py-2 px-3">
                  {r.overdue > 0 ? <span className="badge bg-red-100 text-red-700">{r.overdue}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 px-3">
                  {r.critical > 0 ? <span className="badge bg-orange-100 text-orange-700">{r.critical}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 px-3">
                  {r.high > 0 ? <span className="badge bg-amber-100 text-amber-700">{r.high}</span> : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
}

function ErrorMsg({ msg }) {
  return <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{msg}</div>
}
