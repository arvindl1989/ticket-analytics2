import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export default function MonthlyChart({ data = [] }) {
  if (!data.length) return <Empty />

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          angle={-40}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          cursor={{ fill: '#f3f4f6' }}
        />
        <Bar dataKey="count" name="Tickets Created" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="#6366f1" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function Empty() {
  return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
}
