import { paguAmount } from './pagus.js'

const columns = [
  ['kode_program', 'program', 'nama_program', ['kode_program']],
  ['kode_kegiatan', 'kegiatan', 'nama_kegiatan', ['kode_kegiatan']],
  ['kode_output', 'output', 'nama_output', ['kode_output']],
  ['kode_so', 'suboutput', 'nama_suboutput', ['kode_kegiatan', 'kode_output', 'kode_so']],
  ['kode_komponen', 'komponen', 'nama_komponen', ['kode_kegiatan', 'kode_output', 'kode_so', 'kode_komponen']],
  ['kode_sk', 'sk', 'nama_subkomponen', ['kode_sk']],
  ['kode_akun', 'akun', 'nama_akun', ['kode_akun']],
]
const makeKey = (row, keys) => JSON.stringify(keys.map(key => row[key] ?? ''))
const money = value => new Intl.NumberFormat('id-ID').format(value)

export function buildDetailedBudget(report) {
  const indexes = columns.map(([, source, label, keys]) =>
    new Map(report.names[source].map(row => [makeKey(row, keys), row[label]])))
  const units = new Map(report.units.map(row => [String(row.kode_unit_kerja), row.unit_kerja]))
  const root = { total: 0n, children: new Map(), items: [] }

  for (const record of report.submissions) {
    for (const item of record.items) {
      const amount = paguAmount(item.total_nominal)
      root.total += amount
      let node = root
      columns.forEach(([field, , , keys], depth) => {
        const code = item[field] || '—'
        if (!node.children.has(code)) node.children.set(code, {
          code, label: indexes[depth].get(makeKey(item, keys)) || '', total: 0n, children: new Map(), items: [],
        })
        node = node.children.get(code)
        node.total += amount
      })
      node.items.push({ ...item, amount, number: record.nomor_pengajuan, source: record.jenis_pagu, unit: units.get(String(record.kode_unit_kerja)) })
    }
  }
  return root
}

export const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

export function detailedBudgetPrintHtml(report, scope) {
  const root = buildDetailedBudget(report)
  const rows = []
  function writeRows(parent, depth) {
    const children = [...parent.children.values()].sort((a, b) => a.code.localeCompare(b.code, 'id', { numeric: true }))
    for (const node of children) {
      rows.push('<tr class="group level-' + depth + '"><td style="padding-left:' + (6 + depth * 12)
        + 'px"><strong>' + escapeHtml(node.code) + '</strong> ' + escapeHtml(node.label)
        + '</td><td colspan="4"></td><td class="num">' + money(node.total) + '</td></tr>')
      writeRows(node, depth + 1)
    }
    for (const item of parent.items) {
      rows.push('<tr><td style="padding-left:90px">' + escapeHtml(item.nama_item)
        + '<small>' + escapeHtml(item.number) + ' · ' + escapeHtml(item.unit) + '</small></td><td>'
        + escapeHtml(item.source) + '</td><td class="num">' + escapeHtml(item.volume)
        + '</td><td>' + escapeHtml(item.kode_satuan) + '</td><td class="num">' + money(paguAmount(item.nominal_satuan))
        + '</td><td class="num">' + money(item.amount) + '</td></tr>')
    }
  }
  writeRows(root, 0)
  return `<!doctype html><html lang="id"><meta charset="utf-8"><title>Laporan Detail Anggaran</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 9pt Arial, sans-serif; color: #111; }
  header { text-align: center; margin-bottom: 12px; }
  h1 { margin: 0 0 5px; font-size: 15pt; }
  header p { margin: 3px 0; }
  dl { display: grid; grid-template-columns: 105px 1fr; gap: 3px 10px; margin: 12px 0; }
  dd { margin: 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #bbb; padding: 4px 6px; vertical-align: top; overflow-wrap: anywhere; }
  th { background: #e6eaf0; text-align: left; }
  thead { display: table-header-group; }
  .num { text-align: right; }
  tr { break-inside: avoid; }
  tr.group { break-after: avoid; }
  .level-0, .total { background: #eef1f5; font-weight: bold; }
  .level-1 { font-weight: bold; }
  small { display: block; color: #444; margin-top: 2px; }
  footer { margin-top: 10px; }
</style>
<header><h1>LAPORAN ANGGARAN DETAIL</h1><p>Per Program · Kegiatan · Output · Suboutput · Komponen · Subkomponen · Akun · Item</p></header>
<dl><dt>Kementerian</dt><dd>139 · Kementerian Pendidikan Tinggi, Sains, dan Teknologi</dd>
<dt>Unit Organisasi</dt><dd>03 · Direktorat Jenderal Pendidikan Tinggi</dd>
<dt>Satuan Kerja</dt><dd>693496 · Politeknik Negeri Indramayu</dd>
<dt>Cakupan</dt><dd>${escapeHtml(scope)}</dd>
<dt>Tanggal Cetak</dt><dd>${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(new Date())}</dd></dl>
<table><colgroup><col style="width:49%"><col style="width:9%"><col style="width:7%"><col style="width:9%"><col style="width:12%"><col style="width:14%"></colgroup>
<thead><tr><th>Uraian</th><th>Sumber Dana</th><th>Volume</th><th>Satuan</th><th class="num">Harga Satuan (Rp)</th><th class="num">Nominal Usulan (Rp)</th></tr></thead>
<tbody><tr class="total"><td colspan="5">JUMLAH SELURUHNYA</td><td class="num">${money(root.total)}</td></tr>${rows.join('')}</tbody></table>
<footer>Nominal mencakup rincian pengajuan yang tersimpan, termasuk yang masih dalam proses atau revisi.</footer></html>`
}

export function printDetailedBudget(report, scope) {
  printBudgetHtml(detailedBudgetPrintHtml(report, scope))
}

export function printBudgetHtml(html) {
  const frame = document.createElement('iframe')
  frame.title = 'Cetak laporan anggaran detail'
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0'
  frame.onload = () => {
    const printed = frame.contentWindow
    printed.addEventListener('afterprint', () => frame.remove(), { once: true })
    printed.focus()
    printed.print()
  }
  frame.srcdoc = html
  document.body.append(frame)
}
