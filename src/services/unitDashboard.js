import { request } from './api.js'

export function createUnitDashboardService(send) {
  return async signal => {
    const data = await send('/dashboard/unit', { signal })
    if (!data?.unit || !data.statuses || !Array.isArray(data.sources) || !Array.isArray(data.latest)) throw new Error('Format dashboard unit dari server tidak sesuai.')
    return data
  }
}

export const loadUnitDashboard = createUnitDashboardService(request)
