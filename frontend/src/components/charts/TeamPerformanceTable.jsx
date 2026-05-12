export default function TeamPerformanceTable({ data = [] }) {
  if (!data.length) return <Empty />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-100">
            {['Team Member', 'Active', 'Overdue', 'Critical+', 'SLA Compliance', 'Avg Resolution', 'Total Closed'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((r) => (
            <tr key={r.assigned_to} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3.5 font-semibold text-gray-800">{r.assigned_to}</td>

              {/* Active */}
              <td className="px-4 py-3.5">
                <span className={`font-bold text-base ${r.active > 15 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {r.active}
                </span>
              </td>

              {/* Overdue */}
              <td className="px-4 py-3.5">
                {r.overdue > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    ● {r.overdue}
                  </span>
                ) : (
                  <span className="text-green-500 text-xs font-medium">✓ Clear</span>
                )}
              </td>

              {/* Critical */}
              <td className="px-4 py-3.5">
                {r.critical > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    {r.critical}
                  </span>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>

              {/* SLA Compliance bar */}
              <td className="px-4 py-3.5 min-w-[160px]">
                {r.sla_compliance_pct != null ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          r.sla_compliance_pct >= 80 ? 'bg-green-500'
                          : r.sla_compliance_pct >= 60 ? 'bg-amber-500'
                          : 'bg-red-500'
                        }`}
                        style={{ width: `${r.sla_compliance_pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-10 text-right ${
                      r.sla_compliance_pct >= 80 ? 'text-green-600'
                      : r.sla_compliance_pct >= 60 ? 'text-amber-600'
                      : 'text-red-600'
                    }`}>
                      {r.sla_compliance_pct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-300 text-xs">No closed tickets</span>
                )}
              </td>

              {/* Avg resolution */}
              <td className="px-4 py-3.5 text-gray-600">
                {r.avg_resolution_days != null ? (
                  <span className={r.avg_resolution_days > 20 ? 'text-amber-600 font-medium' : ''}>
                    {r.avg_resolution_days}d
                  </span>
                ) : '—'}
              </td>

              {/* Total closed */}
              <td className="px-4 py-3.5 text-gray-500 font-medium">{r.closed_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Empty() {
  return <div className="py-10 text-center text-gray-400 text-sm">No team data available</div>
}
