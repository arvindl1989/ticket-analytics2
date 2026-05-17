import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { scColor } from '../../utils/colors'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs space-y-1 min-w-[200px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.filter((p) => p.value > 0).map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.fill }} className="truncate">{p.dataKey}</span>
          <span className="font-semibold flex-shrink-0">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-1 flex justify-between font-bold">
        <span className="text-gray-500">Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}

export default function StackedColumnChart({ data, xKey = 'label', height = 300 }) {
  const { rows = [], sub_categories = [] } = data ?? {}
  if (!rows.length) return <Empty />

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 4, right: 10, left: 0, bottom: 65 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          angle={-40}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10, paddingBottom: 6 }} />
        {sub_categories.map((sc, i) => (
          <Bar
            key={sc}
            dataKey={sc}
            stackId="a"
            fill={scColor(sc, i)}
            radius={i === sub_categories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function Empty() {
  return (
    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
      No data available
    </div>
  )
}
