import { useEffect, useState } from 'react'
import { request } from '../../services/api'
import { formatPagu, paguAmount, pagusService } from '../../services/pagus'
import { canVerifySubmission, isReviewSubmission, pengajuansService, selectPengajuans, submissionStages, submissionStatuses } from '../../services/pengajuans'
import { Button, Empty, Metric, Table } from '../../features/governance/Workbench'
import { downloadCsv } from '../../features/governance/demo'
import './unit-dashboard.css'

const sum = (rows, field) => rows.reduce((total, row) => total + paguAmount(row[field]), 0n)
const money = value => formatPagu(value).replace(/\s+/g, ' ')
const unitName = record => record.unit_kerja?.unit_kerja || 'Unit ' + record.kode_unit_kerja

export default function InstitutionDashboard({ role, executive = false, search, onCounts }) {
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const [source, setSource] = useState('')
  const title = executive ? 'Dashboard Eksekutif KPA' : 'Dashboard Superadmin'

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([
      pagusService.list(role, signal),
      pengajuansService.list(signal),
      request(executive ? '/ikus' : '/unit-kerjas', { signal }),
    ]).then(([pagus, submissions, reference]) => {
      if (!Array.isArray(reference)) throw new Error('Format referensi dashboard tidak sesuai.')
      const saldo = sum(pagus, 'nominal_pagu')
      const nominal = sum(submissions, 'total_nominal_pengajuan')
      if (signal.aborted) return
      setState({ pagus, submissions, reference, saldo, nominal })
      onCounts({
        reviews: submissions.filter(record => role === 'KPA' ? canVerifySubmission(record, role) : isReviewSubmission(record)).length,
        corrections: submissions.filter(record => record.status === 'revision').length,
      })
    }).catch(error => {
      if (!signal.aborted) setState({ error: error.message })
    })
    return () => controller.abort()
  }, [attempt, executive, role, onCounts])

  function reload() { setState({ loading: true }); setAttempt(value => value + 1) }

  if (state.loading || state.error) return <section className="dash-card work-panel">
    <h1>{title}</h1>
    {state.loading ? <p role="status">Memuat dashboard…</p> : <div role="alert"><p>{state.error}</p><Button secondary onClick={reload}>Coba lagi</Button></div>}
  </section>

  const { pagus, submissions, reference, saldo, nominal } = state
  const approved = submissions.filter(record => record.status === 'approved')
  const waiting = submissions.filter(record => canVerifySubmission(record, 'KPA'))
  const sources = new Map()
  for (const row of pagus) sources.set(row.jenis_pagu, (sources.get(row.jenis_pagu) || 0n) + paguAmount(row.nominal_pagu))
  const queueSources = [...new Set(waiting.map(row => row.jenis_pagu).filter(Boolean))].sort()
  const rows = selectPengajuans(executive ? waiting : submissions, { search })
    .filter(row => !executive || !source || row.jenis_pagu === source)
    .slice(0, executive ? undefined : 5)
  const statuses = Object.entries(submissionStatuses).map(([status, label]) => [label, submissions.filter(row => row.status === status)])

  return <div className="governance-page unit-dashboard">
    <section className="dash-card work-heading">
      <div><span className="work-eyebrow">RINGKASAN INSTITUSI</span><h1>{title}</h1>
        <p>{executive ? 'Saldo lintas unit, target IKU, dan pengajuan pada tahap validasi akhir.' : 'Saldo pagu dan status pengajuan seluruh unit kerja.'}</p>
      </div>
      <div className="work-actions">
        <Button secondary onClick={reload}>Muat ulang</Button>
        {executive && <Button secondary icon="download" disabled={!pagus.length} onClick={() => downloadCsv('saldo-pagu-eksekutif',
          ['Unit Kerja', 'Sumber Dana', 'Sisa Pagu (Rp)'],
          pagus.map(row => [unitName(row), row.jenis_pagu, row.nominal_pagu]), { demo: false })}>Unduh Saldo Pagu</Button>}
      </div>
    </section>

    <div className="unit-money-grid">
      <Metric label="Sisa Pagu Lintas Unit" value={money(saldo)} detail="Saldo yang tercatat di database" icon="wallet" />
      <Metric label={executive ? 'Nominal Disetujui Final' : 'Nominal Seluruh Pengajuan'} value={money(executive ? sum(approved, 'total_nominal_pengajuan') : nominal)}
        detail={executive ? approved.length + ' pengajuan disetujui' : submissions.length + ' pengajuan tercatat'} icon={executive ? 'check' : 'file'} />
    </div>

    <div className="unit-count-grid">
      {executive ? <>
        <Metric label="Menunggu KPA" value={waiting.length} detail={money(sum(waiting, 'total_nominal_pengajuan'))} icon="review" />
        <Metric label="Perlu Revisi" value={submissions.filter(row => row.status === 'revision').length} detail="Dalam cakupan akun" icon="info" />
        <Metric label="Target IKU" value={reference.length} detail="Indikator terdaftar" icon="chart" />
      </> : <>
        <Metric label="Unit Kerja" value={reference.length} detail="Unit terdaftar" icon="building" />
        <Metric label="Disetujui Final" value={approved.length} detail={money(sum(approved, 'total_nominal_pengajuan'))} icon="check" />
        <Metric label="Perlu Revisi" value={submissions.filter(row => row.status === 'revision').length} detail="Di seluruh tahap" icon="info" />
      </>}
    </div>

    <div className="unit-data-grid">
      <section className="dash-card work-panel">
        <div className="work-section-title"><h2>Saldo per Sumber Dana</h2>{role === 'ADMIN' && <a className="dash-button secondary" href="#/pagu-iku">Daftar Pagu</a>}</div>
        <div className="unit-source-list">{[...sources].sort(([a], [b]) => a.localeCompare(b)).map(([name, amount]) =>
          <div key={name}><span>{name}</span><strong>{money(amount)}</strong></div>)}</div>
        {!sources.size && <Empty>Belum ada alokasi pagu.</Empty>}
      </section>
      <section className="dash-card work-panel">
        <h2>{executive ? 'Target IKU' : 'Status Pengajuan'}</h2>
        {executive ? <div className="unit-status-list">{reference.map(row => <div key={row.kode_iku}>
          <span>{row.kode_iku}</span><strong>{row.target_iku}</strong><small>{row.nama_iku}</small>
        </div>)}{!reference.length && <Empty>Belum ada target IKU.</Empty>}</div> :
          <div className="unit-status-list">{statuses.map(([label, records]) => <div key={label}>
            <span>{label}</span><strong>{records.length}</strong><small>{money(sum(records, 'total_nominal_pengajuan'))}</small>
          </div>)}</div>}
      </section>
    </div>

    <section className="dash-card work-panel">
      <div className="work-section-title">
        <h2>{executive ? 'Antrean Validasi KPA' : 'Pengajuan Terbaru'}</h2>
        {executive ? <select aria-label="Sumber dana antrean KPA" value={source} onChange={event => setSource(event.target.value)}>
          <option value="">Semua sumber dana</option>{queueSources.map(name => <option key={name}>{name}</option>)}
        </select> : <a className="dash-button secondary" href="#/usulan-anggaran">Semua Pengajuan</a>}
      </div>
      {rows.length ? <Table caption={executive ? 'Antrean validasi KPA' : 'Pengajuan terbaru'} headers={['Nomor Pengajuan', 'Unit Kerja', 'Sumber Dana', 'Nominal', 'Status / Tahap', 'Tindakan']}>
        {rows.map(record => <tr key={record.pengajuan_id}>
          <td>{record.nomor_pengajuan}</td><td>{unitName(record)}</td><td>{record.jenis_pagu || '—'}</td>
          <td className="numeric">{money(record.total_nominal_pengajuan)}</td>
          <td>{submissionStatuses[record.status] || record.status}<small>{submissionStages[record.current_position] || record.current_position}</small></td>
          <td><a className="dash-button secondary" href={'#/usulan-anggaran?pengajuan=' + encodeURIComponent(record.pengajuan_id)}>
            {executive && role === 'KPA' ? 'Tinjau' : 'Lihat Detail'}
          </a></td>
        </tr>)}
      </Table> : <Empty>{executive ? 'Tidak ada pengajuan menunggu KPA pada filter ini.' : 'Tidak ada pengajuan yang sesuai.'}</Empty>}
    </section>
  </div>
}
