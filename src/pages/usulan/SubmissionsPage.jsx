import { useEffect, useState } from 'react'
import { Button, Empty, Table } from '../../features/governance/Workbench'
import { pengajuansService, selectPengajuans, submissionStatuses, submissionStages, canVerifySubmission, isReviewSubmission, isCorrectionSubmission, canRepairSubmission, reviewRoleStages } from '../../services/pengajuans'
import { formatPagu, paguAmount } from '../../services/pagus'
import SubmissionDetail from './SubmissionDetail'
import './submissions.css'

const detailId = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('pengajuan')

export default function SubmissionsPage({ search, role, queue = false, corrections = false, onCounts }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('')
  const [stage, setStage] = useState('')
  const [id, setId] = useState(detailId)
  const [onlyMine, setOnlyMine] = useState(() => queue && Object.hasOwn(reviewRoleStages, role))
  const [notice, setNotice] = useState('')
  const basePath = corrections ? '/antrean-koreksi' : queue ? '/antrean-pemeriksaan' : '/usulan-anggaran'
  useEffect(() => {
    const change = () => setId(detailId())
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    pengajuansService.list(controller.signal).then(data => {
      data.forEach(record => paguAmount(record.total_nominal_pengajuan))
      if (!controller.signal.aborted) {
        setRecords(data); setLoading(false)
        onCounts?.({ reviews: Object.hasOwn(reviewRoleStages, role) ? data.filter(record => canVerifySubmission(record, role)).length : data.filter(isReviewSubmission).length, corrections: data.filter(record => record.status === 'revision').length })
      }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false); onCounts?.({ reviews: 0, corrections: 0 }) }
    })
    return () => controller.abort()
  }, [attempt, role, onCounts])
  function refresh() { setError(''); setLoading(true); setAttempt(value => value + 1) }
  const scope = corrections ? records.filter(isCorrectionSubmission) : queue ? records.filter(isReviewSubmission).filter(record => !onlyMine || canVerifySubmission(record, role)) : records
  const rows = selectPengajuans(scope, { search, status, stage })
  function decided(result) {
    setNotice(result.msg)
    window.location.hash = basePath
    refresh()
  }
  return <div className="governance-page submission-page">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">{corrections ? 'KOREKSI PENGAJUAN' : queue ? 'PEMERIKSAAN & PERSETUJUAN' : 'USULAN ANGGARAN'}</span><h1>{corrections ? 'Antrean Koreksi' : queue ? 'Antrean Pemeriksaan' : 'Daftar Pengajuan'}</h1><p>{corrections ? 'Pengajuan yang dikembalikan beserta catatan revisi dan posisi berkas, sesuai kewenangan akun Anda.' : queue ? 'Periksa pengajuan sesuai tahap aktif peran Anda.' : 'Pengajuan dari database sesuai kewenangan akun Anda.'}</p><span className="integration-pill">Data backend</span></div><div className="work-actions"><Button secondary onClick={refresh} disabled={loading}>Muat ulang</Button>{!queue && !corrections && role === 'OPERATOR' && <Button icon="plus" onClick={() => { window.location.hash = '/formulir-usulan' }}>Buat Pengajuan</Button>}</div></section>
    {notice && <p className="work-notice" role="status">{notice}</p>}
    {queue && Object.hasOwn(reviewRoleStages, role) && <div className="work-actions"><Button secondary={!onlyMine} onClick={() => setOnlyMine(true)} aria-pressed={onlyMine}>Tugas Saya</Button><Button secondary={onlyMine} onClick={() => setOnlyMine(false)} aria-pressed={!onlyMine}>Semua dalam Cakupan</Button></div>}
    <section className="dash-card work-panel submission-body" aria-busy={loading}>
      {loading ? <p role="status">Memuat daftar pengajuan…</p> : error ? <div role="alert"><p>{error}</p><Button secondary onClick={refresh}>Coba lagi</Button></div> : <>
        <div className="submission-filters">{corrections ? <div className="submission-fixed-status"><span>Status</span><strong>Perlu Revisi</strong></div> : <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Semua status</option>{Object.entries(submissionStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}<label>{corrections ? 'Posisi Berkas' : 'Tahap Pemeriksaan'}<select value={stage} onChange={event => setStage(event.target.value)}><option value="">Semua tahap</option>{Object.entries(submissionStages).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Button secondary onClick={() => { setStatus(''); setStage('') }}>Reset Filter</Button></div>
        <p>{rows.length} pengajuan hasil pencarian dan filter</p>
        <Table caption={corrections ? 'Pengajuan revisi dari database' : 'Daftar pengajuan dari database'} headers={['Nomor Pengajuan', 'Unit Kerja', 'Total Nominal', 'Status / Tahap', ...(corrections ? ['Catatan Revisi'] : []), 'Tindakan']}>{rows.map(record => <tr key={record.pengajuan_id}><td><a className="submission-number-link" href={`${basePath}?pengajuan=${encodeURIComponent(record.pengajuan_id)}`} aria-label={`Lihat detail pengajuan ${record.nomor_pengajuan}`}>{record.nomor_pengajuan}</a><small>{record.operator?.nama_operator || '—'}</small></td><td>{record.unit_kerja?.unit_kerja || `Unit ${record.kode_unit_kerja}`}</td><td className="numeric">{formatPagu(record.total_nominal_pengajuan)}</td><td>{submissionStatuses[record.status] || record.status}<small>{submissionStages[record.current_position] || record.current_position}</small></td>{corrections && <td className="submission-correction-note">{record.catatan_revisi ? record.catatan_revisi.length > 180 ? record.catatan_revisi.slice(0, 180) + '…' : record.catatan_revisi : 'Belum ada catatan revisi.'}</td>}<td><div className="work-actions">{canRepairSubmission(record, role) && <a className="dash-button" href={`#/formulir-usulan?perbaiki=${encodeURIComponent(record.pengajuan_id)}`}>Perbaiki</a>}<Button secondary onClick={() => { window.location.hash = `${basePath}?pengajuan=${encodeURIComponent(record.pengajuan_id)}` }}>{canVerifySubmission(record, role) ? corrections ? 'Tinjau Koreksi' : 'Periksa' : 'Lihat Detail'}</Button></div></td></tr>)}</Table>
        {!rows.length && <Empty>{corrections ? scope.length ? 'Tidak ada koreksi yang sesuai pencarian atau posisi berkas.' : 'Tidak ada pengajuan yang perlu revisi dalam kewenangan akun Anda.' : records.length ? 'Tidak ada pengajuan yang sesuai pencarian atau filter.' : 'Belum ada pengajuan dalam kewenangan akun Anda.'}</Empty>}
      </>}
    </section>
    {id && <SubmissionDetail key={id} id={id} role={role} onClose={() => { window.location.hash = basePath }} onDecision={decided}/ >}
  </div>
}
