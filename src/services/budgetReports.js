import { paguAmount } from './pagus.js'
import { submissionStages, submissionStatuses } from './pengajuans.js'

const reviewStages = { L02: 'pimpinan_unit', L03: 'tim_sakip', L04: 'spi', L05: 'kpa' }
const categories = {
  L06: /\b(?:bahan )?prakti[kc]um\b|\bpratikum\b/,
  L07: /\baset\b/,
  L08: /\bhonor(?:arium)?\b/,
  L09: /\bperjadin\b|\bperjalanan dinas\b/,
}
export const reportUnitName = row => row.unit_kerja?.unit_kerja || 'Unit ' + row.kode_unit_kerja
const total = rows => rows.reduce((sum, row) => sum + row.at(-1), 0n)
const amount = record => paguAmount(record.total_nominal_pengajuan)

export function buildBudgetReport(code, submissions, { unit = '', source = '', status = '', search = '' } = {}) {
  const query = search.trim().toLowerCase()
  const selected = submissions.filter(row => (!unit || String(row.kode_unit_kerja) === unit)
    && (!source || row.jenis_pagu === source) && (!status || row.status === status))
  const matches = values => values.join(' ').toLowerCase().includes(query)
  if (code === 'L10') return { headers: [], rows: [], total: 0n }

  let headers, rows
  if (code === 'L01') {
    const statuses = Object.keys(submissionStatuses)
    headers = ['Kode Unit', 'Unit Kerja', ...statuses.map(key => submissionStatuses[key] + ' (Rp)'), 'Total Usulan (Rp)']
    const units = new Map()
    for (const record of selected) {
      if (!matches([record.nomor_pengajuan, reportUnitName(record), record.jenis_pagu])) continue
      const key = record.kode_unit_kerja
      if (!units.has(key)) units.set(key, [key, reportUnitName(record), ...statuses.map(() => 0n), 0n])
      const row = units.get(key)
      const index = statuses.indexOf(record.status)
      if (index !== -1) row[index + 2] += amount(record)
      row[row.length - 1] += amount(record)
    }
    rows = [...units.values()]
  } else if (reviewStages[code]) {
    headers = ['Nomor Pengajuan', 'Unit Kerja', 'Sumber Dana', 'Status', 'Tahap', 'Nominal (Rp)']
    rows = selected.filter(row => row.current_position === reviewStages[code] && ['pending', 'revision'].includes(row.status)
      && matches([row.nomor_pengajuan, reportUnitName(row), row.jenis_pagu]))
      .map(row => [row.nomor_pengajuan, reportUnitName(row), row.jenis_pagu || '—', submissionStatuses[row.status], submissionStages[row.current_position], amount(row)])
  } else {
    const iku = code === 'L11'
    headers = ['Nomor Pengajuan', 'Unit Kerja', 'Sumber Dana', 'Kode Akun', 'Nama Item',
      ...(iku ? ['Subkomponen', 'Kode IKU', 'Target IKU'] : ['Jenis Belanja']), 'Nominal Item (Rp)']
    rows = selected.flatMap(record => (record.items || []).flatMap(item => {
      const type = item.jenis_belanja?.jenis_belanja || ''
      if (iku ? !item.kode_iku : !categories[code]?.test(type.trim().toLowerCase())) return []
      if (!matches([record.nomor_pengajuan, reportUnitName(record), record.jenis_pagu, item.nama_item, item.kode_akun, item.kode_iku, type])) return []
      return [[record.nomor_pengajuan, reportUnitName(record), record.jenis_pagu || '—', item.kode_akun, item.nama_item || '—',
        ...(iku ? [item.kode_sk, item.kode_iku, item.target_iku ?? '—'] : [type]), paguAmount(item.total_nominal)]]
    }))
  }
  return { headers, rows, total: total(rows) }
}
