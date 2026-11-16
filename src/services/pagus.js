import { request } from './api.js'

export function createPagusService(send) {
  return {
    async list(role, signal) {
      const scoped = ['OPERATOR', 'PIMPINAN'].includes(role)
      const data = await send(scoped ? '/pagus/unit-kerja' : '/pagus', { signal })
      if (!Array.isArray(data)) throw new Error('Format daftar pagu dari server tidak sesuai.')
      return data
    },
    async options(signal) {
      const [units, sources] = await Promise.all([
        send('/unit-kerjas', { signal }), send('/master-pagus', { signal }),
      ])
      if (!Array.isArray(units) || !Array.isArray(sources)) throw new Error('Format referensi pagu dari server tidak sesuai.')
      return { units, sources }
    },
    async save(values, record) {
      const amount = String(values.nominal_pagu ?? '').trim()
      if (!/^\d+$/.test(amount) || BigInt(amount) > 9223372036854775807n) throw new Error('Nominal harus berupa rupiah bulat tidak negatif dan sesuai batas penyimpanan.')
      const body = { nominal_pagu: BigInt(amount).toString() }
      if (record) body.expected_nominal_pagu = String(record.nominal_pagu)
      else {
        body.kode_unit_kerja = String(values.kode_unit_kerja || '')
        body.jenis_pagu = String(values.jenis_pagu || '').trim()
        if (!/^\d+$/.test(body.kode_unit_kerja) || BigInt(body.kode_unit_kerja) < 1n) throw new Error('Pilih unit kerja.')
        if (!body.jenis_pagu || body.jenis_pagu.length > 255) throw new Error('Isi sumber dana, maksimal 255 karakter.')
      }
      return send(record ? `/pagus/${encodeURIComponent(record.id)}` : '/pagus', { method: record ? 'PATCH' : 'POST', body })
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
