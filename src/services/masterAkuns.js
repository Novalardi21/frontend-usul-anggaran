import { request } from './api.js'

export function createMasterAkunsService(send) {
  return {
    async list(signal) {
      const data = await send('/master-akuns', { signal })
      if (!Array.isArray(data)) throw new Error('Format daftar akun anggaran dari server tidak sesuai.')
      return data
    },
    async save(values, originalCode) {
      const code = typeof values.kode_akun === 'string' ? values.kode_akun.trim() : ''
      const name = typeof values.nama_akun === 'string' ? values.nama_akun.trim() : ''
      if (!code || !name) throw new Error('Kode dan nama akun anggaran wajib diisi.')
      if (code.length > 255 || name.length > 255) throw new Error('Kode dan nama akun anggaran maksimal 255 karakter.')
      const editing = originalCode !== undefined
      if (!editing && !/^\d{6}$/.test(code)) throw new Error('Kode akun anggaran harus terdiri dari 6 digit.')
      return send(editing ? `/master-akuns/${encodeURIComponent(originalCode)}` : '/master-akuns', {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { nama_akun: name } : { kode_akun: code, nama_akun: name },
      })
    },
    async remove(code) {
      if (typeof code !== 'string' || !code.trim()) throw new Error('Kode akun anggaran tidak valid.')
      return send(`/master-akuns/${encodeURIComponent(code)}`, { method: 'DELETE' })
    },
  }
}

export const masterAkunsService = createMasterAkunsService(request)
