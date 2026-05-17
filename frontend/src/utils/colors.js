// Consistent sub-category colour palette — matches the KPI dashboard
export const SUB_CAT_COLORS = {
  'Website Content Management':          '#1d4ed8',
  'Demand Creation – Global':            '#d97706',
  'Retention – Activations':             '#059669',
  'Email – Local':                       '#0891b2',
  'Content Production – Graphic Design': '#7c3aed',
}

export const PALETTE = [
  '#1d4ed8', '#d97706', '#059669', '#0891b2', '#7c3aed',
  '#db2777', '#dc2626', '#ea580c', '#65a30d', '#0f766e',
]

export const scColor = (name, idx) =>
  SUB_CAT_COLORS[name] ?? PALETTE[idx % PALETTE.length]
