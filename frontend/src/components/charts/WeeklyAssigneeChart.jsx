import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
]

export default function WeeklyAssigneeChart({ data = [], assignees = [], limit = 16 }) {
  const [selected, setSelected] = useState([])

  if (!data.weeks?.length) return <Empty />

  const visible = data.weeks.slice(-limit)
  const people = selected.length ? selected : (assignees.length <= 8 ? assignees : assignees.slice(0, 8))

  const toggle = (name) =>
    setSelected((s) => s.includes(name) ? s.filter((x) => x !== name) : [...s, name])

  return (
    <div>
      {assignees.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {assignees.map((a, i) => (
            <button
              key={a}
              onClick={() => toggle(a)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                people.includes(a)
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
              style={people.includes(a) ? { backgroundColor: COLORS[i % COLORS.length] } : {}}
            >
              {a}
            </button>
          ))}
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-600 px-2">
              Reset
            </button>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={visible} margin={{ top: 5, right: 10, left: 0, bottom: 70 }}>
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
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          {people.map((a, i) => (
            <Bar key={a} dataKey={a} stackId="a" fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Empty() {
  return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
}
