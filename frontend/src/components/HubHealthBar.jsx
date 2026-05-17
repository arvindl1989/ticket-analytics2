const stateColor = (state = '') => {
  const s = state.toLowerCase()
  if (s.includes('completed') || s.includes('resolved')) return '#059669'
  if (s.includes('rejected'))  return '#ef4444'
  if (s.includes('confirmation')) return '#10b981'
  if (s.includes('in progress') || s.includes('progress')) return '#3b82f6'
  if (s.includes('assigned'))  return '#6366f1'
  if (s.includes('hold') || s.includes('pending')) return '#f59e0b'
  if (s.includes('review'))    return '#8b5cf6'
  if (s.includes('open'))      return '#64748b'
  return '#94a3b8'
}

export default function HubHealthBar({ data }) {
  if (!data || !data.total) return null
  const { by_state = [], total, done_pct } = data

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="flex h-9 rounded-lg overflow-hidden gap-[2px] bg-gray-100">
        {by_state.map((s) => {
          const pct = (s.count / total) * 100
          if (pct < 0.3) return null
          return (
            <div
              key={s.state}
              className="flex items-center justify-center text-white text-xs font-semibold transition-all"
              style={{ width: `${pct}%`, backgroundColor: stateColor(s.state) }}
              title={`${s.state}: ${s.count} (${pct.toFixed(1)}%)`}
            >
              {pct > 6 ? s.count : ''}
            </div>
          )
        })}
        <div className="ml-auto px-3 flex items-center">
          <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{done_pct}% Done</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {by_state.map((s) => (
          <div key={s.state} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: stateColor(s.state) }} />
            <span className="text-gray-500">{s.state}</span>
            <span className="font-semibold text-gray-700">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
