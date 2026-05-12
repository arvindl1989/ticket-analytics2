import axios from 'axios'

const client = axios.create({ baseURL: (import.meta.env.VITE_API_URL ?? '') + '/api' })

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 404 && err.config.url?.includes('/sessions/')) {
      const e = new Error('SESSION_EXPIRED')
      e.sessionExpired = true
      return Promise.reject(e)
    }
    return Promise.reject(err)
  }
)

export async function uploadFile(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/upload', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return data
}

export async function getOverview(sid) {
  const { data } = await client.get(`/sessions/${sid}/overview`)
  return data
}

export async function getMonthlyCreated(sid) {
  const { data } = await client.get(`/sessions/${sid}/monthly-created`)
  return data
}

export async function getWeeklyComparison(sid) {
  const { data } = await client.get(`/sessions/${sid}/weekly-comparison`)
  return data
}

export async function getWeeklyByAssignee(sid, assignees = []) {
  const params = assignees.length ? { assignees: assignees.join(',') } : {}
  const { data } = await client.get(`/sessions/${sid}/weekly-by-assignee`, { params })
  return data
}

export async function getByArea(sid, dateFrom, dateTo, dimFilters = {}) {
  const { data } = await client.get(`/sessions/${sid}/by-area`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo, ...dimFilters }),
  })
  return data
}

export async function getByTeam(sid, dateFrom, dateTo, dimFilters = {}) {
  const { data } = await client.get(`/sessions/${sid}/by-team`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo, ...dimFilters }),
  })
  return data
}

export async function getByCreator(sid, dateFrom, dateTo, dimFilters = {}) {
  const { data } = await client.get(`/sessions/${sid}/by-creator`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo, ...dimFilters }),
  })
  return data
}

export async function getInflowOutflow(sid, dateFrom, dateTo, groupBy = 'week', dimFilters = {}) {
  const { data } = await client.get(`/sessions/${sid}/inflow-outflow`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo, group_by: groupBy, ...dimFilters }),
  })
  return data
}

export async function getSlaPerformance(sid, dateFrom, dateTo, dimFilters = {}) {
  const { data } = await client.get(`/sessions/${sid}/sla-performance`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo, ...dimFilters }),
  })
  return data
}

export async function getResolutionTime(sid, dateFrom, dateTo, dimFilters = {}) {
  const { data } = await client.get(`/sessions/${sid}/resolution-time`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo, ...dimFilters }),
  })
  return data
}

function _clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== ''))
}

export async function getPriority(sid, filters = {}) {
  const { data } = await client.get(`/sessions/${sid}/priority`, { params: filters })
  return data
}

export function getExportUrl(sid, format = 'csv', filters = {}) {
  const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  const params = new URLSearchParams({ format, ...clean })
  return `/api/sessions/${sid}/export?${params}`
}

export async function getTeamPerformance(sid, dateFrom, dateTo) {
  const { data } = await client.get(`/sessions/${sid}/team-performance`, {
    params: _clean({ date_from: dateFrom, date_to: dateTo }),
  })
  return data
}

export async function getBacklogAge(sid) {
  const { data } = await client.get(`/sessions/${sid}/backlog-age`)
  return data
}

export async function getSlaRules() {
  const { data } = await client.get('/sla-rules')
  return data
}

export async function updateSlaRules(rules) {
  const { data } = await client.put('/sla-rules', rules)
  return data
}
