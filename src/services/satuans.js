import { request } from './api.js'

export function createSatuansService(send) {
  return {
    async list(signal) {
      const data = await send('/master-satuans', { signal })
      if (!Array.isArray(data)) throw new Error('Format daftar satuan dari server tidak sesuai.')
      return data
    },
    async save(values, originalCode) {
      const code = typeof values.kode_satuan === 'string' ? values.kode_satuan.trim() : ''
      const name = typeof values.nama_satuan === 'string' ? values.nama_satuan.trim() : ''
      if (!code || !name) throw new Error('Kode dan nama satuan wajib diisi.')
      if (code.length > 255 || name.length > 255) throw new Error('Kode dan nama satuan maksimal 255 karakter.')
      const editing = originalCode !== undefined
      return send(editing ? `/master-satuans/${encodeURIComponent(originalCode)}` : '/master-satuans', {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { nama_satuan: name } : { kode_satuan: code, nama_satuan: name },
      })
    },
    async remove(code) {
      if (typeof code !== 'string' || !code.trim()) throw new Error('Kode satuan tidak valid.')
      return send(`/master-satuans/${encodeURIComponent(code)}`, { method: 'DELETE' })
    },
  }
}

export const satuansService = createSatuansService(request)
