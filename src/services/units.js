import { request } from './api.js'

export function createUnitsService(send) {
  return {
    async list(signal) {
      const data = await send('/unit-kerjas', { signal })
      if (!Array.isArray(data)) throw new Error('Format daftar unit kerja dari server tidak sesuai.')
      return data
    },
    async save(name, id) {
      const unitName = typeof name === 'string' ? name.trim() : ''
      if (!unitName) throw new Error('Nama unit kerja wajib diisi.')
      if (unitName.length > 255) throw new Error('Nama unit kerja maksimal 255 karakter.')
      const editing = id !== undefined && id !== null
      return send(editing ? `/unit-kerjas/${encodeURIComponent(id)}` : '/unit-kerjas', {
        method: editing ? 'PATCH' : 'POST', body: { unit_kerja: unitName },
      })
    },
    async remove(id) {
      if (id === undefined || id === null || id === '') throw new Error('Kode unit kerja tidak valid.')
      return send(`/unit-kerjas/${encodeURIComponent(id)}`, { method: 'DELETE' })
    },
  }
}

export const unitsService = createUnitsService(request)
