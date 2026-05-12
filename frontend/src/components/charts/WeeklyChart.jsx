import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function WeeklyChart({ data = [], limit = 26 }) {
  const visible = data.slice(-limit)
  if (!visible.length) return <Empty />

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={visible} margin={{ top: 5, right: 10, left: 0, bottom: 75 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          angle={-45}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          cursor={{ fill: '#f9fafb' }}
        />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
        <Bar dataKey="created" name="Created" fill="#6366f1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="closed" name="Closed" fill="#22c55e" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function Empty() {
  return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
}
