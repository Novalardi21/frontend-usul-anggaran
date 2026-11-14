import { escapeHtml } from './detailedBudgetReport.js'
import { formatPagu } from './pagus.js'

export function budgetSummaryPrintHtml(report, { title, scope, source, status }) {
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(new Date())
  const headers = report.headers.map(label => {
    const className = label.endsWith('(Rp)') ? 'num' : label === 'Kode Unit' ? 'unit-code' : label === 'Nomor Pengajuan' ? 'reference' : ''
    return '<th class="' + className + '">' + escapeHtml(label) + '</th>'
  }).join('')
  const rows = report.rows.map(row => '<tr>' + row.map(cell => typeof cell === 'bigint'
    ? '<td class="num">' + escapeHtml(formatPagu(cell)) + '</td>'
    : '<td>' + escapeHtml(cell) + '</td>').join('') + '</tr>').join('')

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { margin: 0; color: #172033; font: 9pt Arial, sans-serif; }
  header { margin-bottom: 14px; }
  header p { margin: 0 0 4px; }
  h1 { margin: 6px 0 8px; font-size: 16pt; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { padding: 6px; border: 1px solid #b9c3d2; vertical-align: top; overflow-wrap: anywhere; white-space: pre-line; }
  th { background: #edf1f6; text-align: left; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  .num { text-align: right; }
  .unit-code { width: 6%; }
  .reference { width: 17%; }
  footer { margin-top: 10px; text-align: right; font-weight: bold; break-inside: avoid; }
</style></head><body>
<header><p>POLITEKNIK NEGERI INDRAMAYU</p><h1>${escapeHtml(title)}</h1>
<p>Unit kerja: ${escapeHtml(scope)} &nbsp; | &nbsp; Sumber dana: ${escapeHtml(source)} &nbsp; | &nbsp; Status: ${escapeHtml(status)}</p>
<p>Tanggal cetak: ${escapeHtml(date)}</p></header>
<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
<footer>Total nominal laporan: ${escapeHtml(formatPagu(report.total))}</footer>
</body></html>`
}
