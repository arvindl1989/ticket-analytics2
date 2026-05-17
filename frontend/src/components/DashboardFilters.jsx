import DateRangePicker from './DateRangePicker'

const EXCLUDED = new Set(['Dheera Sameera', 'Pooja V', 'Suresh Karthik'])

export default function DashboardFilters({ overview, filters, range, onFilter, onRange }) {
  const assignees = (overview?.assigned_to_list ?? []).filter((a) => !EXCLUDED.has(a))
  const teams     = overview?.team_list         ?? []
  const areas     = overview?.area_list         ?? []
  const subCats   = overview?.sub_category_list ?? []

  const set = (key) => (e) => onFilter(key, e.target.value)
  const hasActive = Object.values(filters).some(Boolean) || range.from || range.to

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select label="Assignee"    value={filters.assigned_to}  onChange={set('assigned_to')}  opts={assignees} />
      <Select label="Team"        value={filters.team}         onChange={set('team')}          opts={teams} />
      <Select label="Area"        value={filters.area}         onChange={set('area')}          opts={areas} />
      <Select label="Sub Category" value={filters.sub_category} onChange={set('sub_category')} opts={subCats} />

      <DateRangePicker
        dateFrom={range.from}
        dateTo={range.to}
        onChange={(from, to) => onRange({ from, to })}
      />

      {hasActive && (
        <button
          onClick={() => { onFilter('__reset__'); onRange({ from: '', to: '' }) }}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1.5 rounded hover:bg-indigo-50 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

function Select({ label, value, onChange, opts }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
    >
      <option value="">All {label}s</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
