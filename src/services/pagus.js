import { request } from './api.js'

export function createPagusService(send) {
  return {
    async list(role, signal) {
      const scoped = ['OPERATOR', 'PIMPINAN'].includes(role)
      const data = await send(scoped ? '/pagus/unit-kerja' : '/pagus', { signal })
      if (!Array.isArray(data)) throw new Error('Format daftar pagu dari server tidak sesuai.')
      return data
    },
  }
}

export const pagusService = createPagusService(request)

export function paguAmount(value) {
  const text = String(value)
  if (!/^-?\d+$/.test(text)) throw new Error('Nominal pagu dari server tidak valid.')
  return BigInt(text)
}

export const formatPagu = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(paguAmount(value))

export function selectPagus(records, { search = '', unit = '', source = '' }) {
  return records.filter(record => (!unit || String(record.kode_unit_kerja) === unit)
    && (!source || record.jenis_pagu === source)
    && `${record.kode_unit_kerja} ${record.unit_kerja?.unit_kerja || ''} ${record.jenis_pagu}`.toLowerCase().includes(search.toLowerCase()))
}
