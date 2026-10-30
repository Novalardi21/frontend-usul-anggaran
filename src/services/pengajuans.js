import { request } from './api.js'

export const submissionStatuses = { draft: 'Draf', pending: 'Dalam Proses', approved: 'Disetujui', rejected: 'Ditolak', revision: 'Perlu Revisi' }
export const submissionStages = { operator: 'Operator', pimpinan_unit: 'Pimpinan Unit', tim_sakip: 'SAKIP', spi: 'SPI', kpa: 'KPA', completed: 'Selesai' }
export const reviewRoleStages = { PIMPINAN: 'pimpinan_unit', SAKIP: 'tim_sakip', SPI: 'spi', KPA: 'kpa' }
export function canVerifySubmission(record, role) {
  return Object.hasOwn(reviewRoleStages, role) && ['pending', 'revision'].includes(record.status) && record.current_position === reviewRoleStages[role]
}
export function isReviewSubmission(record) {
  return ['pending', 'revision'].includes(record.status) && ['pimpinan_unit', 'tim_sakip', 'spi', 'kpa'].includes(record.current_position)
}
export function isCorrectionSubmission(record) {
  return record.status === 'revision'
}
export function canRepairSubmission(record, role) {
  return role === 'OPERATOR' && record.status === 'revision' && record.current_position === 'operator'
}

export function createPengajuansService(send) {
  return {
    async list(signal) {
      const data = await send('/pengajuans', { signal })
      if (!Array.isArray(data)) throw new Error('Format daftar pengajuan dari server tidak sesuai.')
      return data
    },
    async detail(id, signal) {
      const data = await send(`/pengajuans/${encodeURIComponent(id)}`, { signal })
      if (!data?.pengajuan_id || !Array.isArray(data.items)) throw new Error('Format detail pengajuan dari server tidak sesuai.')
      return data
    },
    async options(signal) {
      const [pagus, accounts, satuans] = await Promise.all([
        send('/pagus/unit-kerja', { signal }), send('/akuns', { signal }), send('/master-satuans', { signal }),
      ])
      if (![pagus, accounts, satuans].every(Array.isArray)) throw new Error('Format referensi pengajuan tidak sesuai.')
      return { pagus, accounts, satuans }
    },
    async submit(body) { return send('/pengajuans', { method: 'POST', body }) },
    async resubmit(id, body) { return send(`/pengajuans/${encodeURIComponent(id)}/resubmit`, { method: 'PATCH', body }) },
    async verify(record, action, note = '') {
      if (!['approve', 'revise'].includes(action)) throw new Error('Keputusan tidak valid.')
      const comment = action === 'revise' ? note.trim() : ''
      if (action === 'revise' && !comment) throw new Error('Isi alasan pengembalian pengajuan.')
      if (comment.length > 5000) throw new Error('Catatan maksimal 5000 karakter.')
      return send(`/pengajuans/${encodeURIComponent(record.pengajuan_id)}/verify`, {
        method: 'PATCH', body: {
          action, catatan_revisi: comment, expected_position: record.current_position,
          expected_status: record.status, ...(record.updatedAt ? { expected_updated_at: record.updatedAt } : {}),
        },
      })
    },
  }
}

export const pengajuansService = createPengajuansService(request)

export function selectPengajuans(records, { search = '', status = '', stage = '' }) {
  const query = search.trim().toLowerCase()
  return records.filter(record => (!status || record.status === status) && (!stage || record.current_position === stage)
    && `${record.nomor_pengajuan} ${record.kode_unit_kerja} ${record.unit_kerja?.unit_kerja || ''} ${record.operator?.nama_operator || ''}`.toLowerCase().includes(query))
}

export function submissionTotal(items) {
  let total = 0n
  for (const item of items) {
    if (!/^\d+$/.test(String(item.volume)) || !/^\d+$/.test(String(item.nominal_satuan))) return null
    const volume = BigInt(item.volume), price = BigInt(item.nominal_satuan)
    if (volume < 1n || volume > 2147483647n || price < 1n || volume * price > 9223372036854775807n) return null
    total += volume * price
  }
  return total <= 9223372036854775807n ? total : null
}

export function revisionBudget(record, options, selectedSource) {
  if (!record) return null
  const legacy = record.pagu_id == null && !record.jenis_pagu
  if (legacy) return { legacy: true, source: '', available: BigInt(record.total_nominal_pengajuan) }
  const matches = options.pagus.filter(pagu => (record.pagu_id == null || String(pagu.id) === String(record.pagu_id)) && (!record.jenis_pagu || pagu.jenis_pagu === record.jenis_pagu))
  const originalSource = matches[0]?.jenis_pagu || record.jenis_pagu || ''
  const source = selectedSource === undefined ? originalSource : selectedSource
  const targets = options.pagus.filter(pagu => pagu.jenis_pagu === source)
  const moved = source !== originalSource
  return { legacy: false, source, originalSource, moved, available: matches.length === 1 && targets.length === 1 ? BigInt(targets[0].nominal_pagu) + (moved ? 0n : BigInt(record.total_nominal_pengajuan)) : null }
}

export function revisionItems(record, accounts) {
  const keys = ['kode_akun', 'kode_sk', 'kode_so', 'kode_output', 'kode_kegiatan', 'kode_program']
  return record.items.map(item => {
    const matches = accounts.filter(account => keys.every(key => String(account[key]) === String(item[key])))
    return { akun_id: matches.length === 1 ? String(matches[0].id) : '', kode_satuan: item.kode_satuan, volume: String(item.volume), nominal_satuan: String(item.nominal_satuan) }
  })
}

export function prepareSubmission(values, options, original = null) {
  const nomor = values.nomor_pengajuan.trim()
  if (!nomor || nomor.length > 255) throw new Error('Isi nomor pengajuan, maksimal 255 karakter.')
  const balances = options.pagus.filter(record => record.jenis_pagu === values.jenis_pagu)
  const correction = revisionBudget(original, options, values.jenis_pagu)
  if (!original && balances.length !== 1) throw new Error('Pagu sumber dana tidak tersedia atau ganda. Muat ulang atau hubungi Admin.')
  if (original && (values.nomor_pengajuan !== original.nomor_pengajuan || !canRepairSubmission(original, 'OPERATOR'))) throw new Error('Pengajuan tidak tersedia untuk perbaikan. Muat ulang.')
  if (correction?.legacy && values.jenis_pagu) throw new Error('Sumber dana asal pengajuan lama harus dipastikan sebelum memindahkan pagu.')
  if (!values.items.length) throw new Error('Tambahkan setidaknya satu rincian.')
  const total = submissionTotal(values.items)
  if (total === null || total <= 0n) throw new Error('Volume dan harga harus bilangan bulat positif dalam batas penyimpanan.')
  if (correction?.legacy && total !== correction.available) throw new Error('Sumber pagu pengajuan lama belum tercatat. Total revisi harus tetap sama.')
  const available = original ? correction.available : BigInt(balances[0].nominal_pagu)
  if (available === null) throw new Error('Pagu asal tidak tersedia atau ganda. Hubungi Admin.')
  if (total > available) throw new Error('Total pengajuan melebihi sisa pagu sumber dana yang dipilih.')
  const items = values.items.map(item => {
    if (!options.accounts.some(account => String(account.id) === item.akun_id)) throw new Error('Pilih akun dari hierarki terdaftar untuk setiap rincian.')
    if (!options.satuans.some(satuan => satuan.kode_satuan === item.kode_satuan)) throw new Error('Pilih satuan untuk setiap rincian.')
    return { akun_id: item.akun_id, kode_satuan: item.kode_satuan, volume: String(item.volume), nominal_satuan: String(item.nominal_satuan) }
  })
  if (original) return { items, expected_updated_at: original.updatedAt, expected_total: String(original.total_nominal_pengajuan), ...(correction.legacy ? {} : { jenis_pagu: values.jenis_pagu }) }
  return { nomor_pengajuan: nomor, jenis_pagu: values.jenis_pagu, items }
}
