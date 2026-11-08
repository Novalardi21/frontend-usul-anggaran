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
      const endpoints = {
        pagus: '/pagus/unit-kerja', accounts: '/akuns', satuans: '/master-satuans',
        subcomponents: '/subkomponens', components: '/komponens', suboutputs: '/suboutputs',
        outputs: '/outputs', activities: '/kegiatans', programs: '/programs', indicators: '/ikus',
        spendingTypes: '/jenis-belanjas',
      }
      const entries = await Promise.all(Object.entries(endpoints).map(async ([key, path]) => {
        const data = await send(path, { signal })
        if (!Array.isArray(data)) throw new Error('Format referensi pengajuan tidak sesuai.')
        return [key, data]
      }))
      return Object.fromEntries(entries)
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

export const submissionCodeFields = [
  ['kode_akun', 'Kode Akun', 'accounts', 'nama_akun'],
  ['kode_sk', 'Kode SK', 'subcomponents', 'nama_subkomponen'],
  ['kode_komponen', 'Kode Komponen', 'components', 'nama_komponen'],
  ['kode_so', 'Kode SO', 'suboutputs', 'nama_suboutput'],
  ['kode_output', 'Kode Output', 'outputs', 'nama_output'],
  ['kode_kegiatan', 'Kode Kegiatan', 'activities', 'nama_kegiatan'],
  ['kode_program', 'Kode Program', 'programs', 'nama_program'],
  ['kode_iku', 'Kode IKU', 'indicators', 'nama_iku'],
]
const itemKeys = [...submissionCodeFields.map(([key]) => key), 'nama_item', 'target_iku', 'kode_jenis_belanja', 'kode_satuan', 'volume', 'nominal_satuan']

export function submissionItemValues(item = {}) {
  return Object.fromEntries(itemKeys.map(key => [key, String(item[key] ?? '').trim()]))
}

export function revisionItems(record) {
  return record.items.map(submissionItemValues)
}

const sourceByActivity = new Map([['7731', 'BOPTN'], ['7732', 'PNBP'], ['7734', 'RM']])

export function submissionFunding(items) {
  const sources = new Set(items.map(item => sourceByActivity.get(String(item.kode_kegiatan ?? '').trim())))
  if (sources.size > 1 && !sources.has(undefined)) return { source: '', error: 'Pisahkan pengajuan jika rincian memakai jenis pagu berbeda.' }
  if (items.some(item => item.kode_kegiatan && !sourceByActivity.has(String(item.kode_kegiatan).trim()))) return { source: '', error: 'Kode kegiatan belum memiliki jenis pagu.' }
  if (sources.has(undefined) || sources.size !== 1) return { source: '', error: '' }
  return { source: [...sources][0], error: '' }
}

export function prepareSubmission(values, options, original = null) {
  const funding = submissionFunding(values.items)
  if (!funding.source) throw new Error(funding.error || 'Pilih kode kegiatan untuk setiap rincian.')
  const source = original && original.pagu_id == null && !original.jenis_pagu ? '' : funding.source
  const balances = options.pagus.filter(record => record.jenis_pagu === source)
  const correction = revisionBudget(original, options, source)
  if (!original && balances.length !== 1) throw new Error('Pagu sumber dana tidak tersedia atau ganda. Muat ulang atau hubungi Admin.')
  if (original && !canRepairSubmission(original, 'OPERATOR')) throw new Error('Pengajuan tidak tersedia untuk perbaikan. Muat ulang.')
  if (!values.items.length) throw new Error('Tambahkan setidaknya satu rincian.')
  const total = submissionTotal(values.items)
  if (total === null || total <= 0n) throw new Error('Volume dan harga harus bilangan bulat positif dalam batas penyimpanan.')
  if (correction?.legacy && total !== correction.available) throw new Error('Sumber pagu pengajuan lama belum tercatat. Total revisi harus tetap sama.')
  const available = original ? correction.available : BigInt(balances[0].nominal_pagu)
  if (available === null) throw new Error('Pagu asal tidak tersedia atau ganda. Hubungi Admin.')
  if (total > available) throw new Error('Total pengajuan melebihi sisa pagu sumber dana yang dipilih.')
  const items = values.items.map(item => {
    const fields = submissionItemValues(item)
    for (const [key, label, source] of submissionCodeFields) {
      if (!options[source].some(row => String(row[key]) === fields[key])) throw new Error(label + ' harus dipilih dari data master.')
    }
    if (!fields.nama_item || fields.nama_item.length > 255) throw new Error('Isi nama item, maksimal 255 karakter.')
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(fields.target_iku)) throw new Error('Isi target IKU dengan maksimal dua angka desimal.')
    if (!options.spendingTypes.some(row => String(row.kode_jenis_belanja) === fields.kode_jenis_belanja)) throw new Error('Pilih jenis belanja yang terdaftar.')
    if (!options.satuans.some(row => row.kode_satuan === fields.kode_satuan)) throw new Error('Pilih satuan yang terdaftar.')
    return fields
  })
  if (original) return { items, expected_updated_at: original.updatedAt, expected_total: String(original.total_nominal_pengajuan), ...(correction.legacy ? {} : { jenis_pagu: source }) }
  return { jenis_pagu: source, items }
}
