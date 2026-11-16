import { useEffect, useState } from 'react'
import { Button, Empty, Table, Tabs } from '../../features/governance/Workbench'
import { REPORTS, downloadCsv } from '../../features/governance/demo'
import { request } from '../../services/api'
import { formatPagu } from '../../services/pagus'
import { submissionStatuses } from '../../services/pengajuans'
import { buildBudgetReport, reportUnitName } from '../../services/budgetReports'

import { budgetSummaryPrintHtml } from '../../services/budgetSummaryPrint'
import { printBudgetHtml } from '../../services/detailedBudgetReport'
import DetailedBudgetReport from './DetailedBudgetReport'

const defaultFilters = { unit: '', source: '', status: '' }
const needsItems = code => ['L06', 'L07', 'L08', 'L09', 'L11'].includes(code)

export default function LiveReportsPage({ role, unitName, search }) {
  const allowed = REPORTS.filter(([, , roles]) => !roles || roles.includes(role))
  const [code, setCode] = useState(() => {
    const wanted = new URLSearchParams(window.location.hash.split('?')[1]).get('kode')
    return allowed.some(([id]) => id === wanted) ? wanted : 'L01'
  })
  const [state, setState] = useState({})
  const [attempt, setAttempt] = useState(0)
  const [filters, setFilters] = useState(defaultFilters)
  const withItems = needsItems(code)
  const key = String(withItems) + ':' + attempt

  useEffect(() => {
    const controller = new AbortController()
    request(withItems ? '/pengajuans?include=report-items' : '/pengajuans', { signal: controller.signal }).then(data => {
      if (!Array.isArray(data) || (withItems && data.some(row => !Array.isArray(row.items)))) {
        throw new Error('Backend belum mengirim rincian laporan. Pastikan backend sudah dimuat ulang.')
      }
      if (!controller.signal.aborted) setState({ key, data })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, error: error.message })
    })
    return () => controller.abort()
  }, [withItems, key])

  const submissions = state.key === key ? state.data : null
  const error = state.key === key ? state.error : null
  const units = new Map(submissions?.map(row => [String(row.kode_unit_kerja), reportUnitName(row)]))
  const sources = [...new Set(submissions?.map(row => row.jenis_pagu).filter(Boolean))].sort()
  const report = submissions && buildBudgetReport(code, submissions, { ...filters, search })
  const name = allowed.find(([id]) => id === code)?.[1]

  function printSummary() {
    printBudgetHtml(budgetSummaryPrintHtml(report, {
      title: code + ' - ' + name,
      scope: units.get(filters.unit) || unitName || 'Semua unit dalam cakupan',
      source: filters.source || 'Semua sumber dana',
      status: submissionStatuses[filters.status] || 'Semua status',
    }))
  }

  return <div className="governance-page">
    <section className="dash-card work-heading">
      <div><span className="work-eyebrow">ARSIP & REKAPITULASI KEUANGAN</span><h1>Pusat Laporan Anggaran L01–L11</h1>
        <p>Rekap pengajuan yang tersedia dalam cakupan akun Anda.</p></div>
      <div className="work-actions">
        <Button secondary onClick={() => setAttempt(value => value + 1)}>Muat ulang</Button>
        <Button secondary icon="download" disabled={!report?.rows.length}
          onClick={() => downloadCsv(code, report.headers, report.rows, { demo: false })}>Ekspor CSV</Button>
        <Button disabled={!report?.rows.length} onClick={printSummary}>Cetak Rekap PDF</Button>
      </div>
    </section>
    <DetailedBudgetReport role={role} unitName={unitName} />
    <section className="dash-card work-panel">
      <Tabs label="Jenis laporan" items={allowed.map(([id, title]) => [id, id + ' · ' + title])} value={code}
        onChange={id => { setCode(id); window.history.replaceState(null, '', '#/laporan?kode=' + id) }} />
    </section>
    {code === 'L10' ? <section className="dash-card work-panel"><h2>{code} · {name}</h2>
      <Empty>Jadwal penarikan bulanan belum tersedia di database.</Empty></section> :
      error ? <section className="dash-card work-panel" role="alert">{error}</section> :
      !report ? <section className="dash-card work-panel" role="status">Memuat laporan…</section> : <>
        <section className="dash-card work-panel"><div className="work-filters">
          <label>Unit Kerja<select value={filters.unit} onChange={event => setFilters({ ...filters, unit: event.target.value })}>
            <option value="">Semua unit dalam cakupan</option>{[...units].map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select></label>
          <label>Sumber Dana<select value={filters.source} onChange={event => setFilters({ ...filters, source: event.target.value })}>
            <option value="">Semua sumber dana</option>{sources.map(source => <option key={source}>{source}</option>)}
          </select></label>
          <label>Status<select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Semua status</option>{Object.entries(submissionStatuses).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select></label>
          <Button secondary onClick={() => setFilters(defaultFilters)}>Reset</Button>
        </div></section>
        <section className="dash-card">
          <div className="work-panel work-section-title"><h2>{code} · {name}</h2><span className="work-pill">{report.rows.length} baris</span></div>
          <Table caption={name} headers={report.headers}>{report.rows.map((row, i) => <tr key={i}>
            {row.map((cell, j) => <td className={typeof cell === 'bigint' ? 'numeric' : undefined} style={code === 'L01' && j === 2 ? { whiteSpace: 'pre-line' } : undefined} key={j}>
              {typeof cell === 'bigint' ? formatPagu(cell) : cell}
            </td>)}
          </tr>)}</Table>
          {!report.rows.length && <Empty>Belum ada data yang sesuai untuk laporan ini.</Empty>}
          <div className="work-total">Total nominal laporan: {formatPagu(report.total)}</div>
        </section>
      </>}
  </div>
}
