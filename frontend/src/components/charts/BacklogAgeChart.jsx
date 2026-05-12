import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

export default function BacklogAgeChart({ data = [] }) {
  if (!data.length || data.every((d) => d.count === 0))
    return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No active tickets</div>

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#374151' }} width={80} />
          <Tooltip
            formatter={(v) => [`${v} tickets (${total > 0 ? Math.round(v / total * 100) : 0}%)`, 'Count']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((d) => <Cell key={d.label} fill={d.color} />)}
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Percentage breakdown */}
      <div className="flex gap-2 flex-wrap">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-500">{d.label}</span>
            <span className="font-semibold text-gray-700">
              {total > 0 ? `${Math.round(d.count / total * 100)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
