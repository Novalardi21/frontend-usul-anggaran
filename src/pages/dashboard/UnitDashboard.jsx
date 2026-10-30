import { useEffect, useState } from 'react'
import { loadUnitDashboard } from '../../services/unitDashboard'
import { formatPagu, paguAmount } from '../../services/pagus'
import { submissionStatuses, submissionStages } from '../../services/pengajuans'
import { Button, Empty, Metric, Table } from '../../features/governance/Workbench'
import './unit-dashboard.css'

export default function UnitDashboard({ user, search, onCounts }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const leader = user.role === 'PIMPINAN'
  useEffect(() => {
    const controller = new AbortController()
    loadUnitDashboard(controller.signal).then(result => {
      paguAmount(result.saldo_pagu)
      paguAmount(result.nominal_pengajuan)
      result.sources.forEach(source => paguAmount(source.saldo))
      Object.values(result.statuses).forEach(status => paguAmount(status.amount))
      result.latest.forEach(record => paguAmount(record.total_nominal_pengajuan))
      if (!controller.signal.aborted) {
        setData(result); setLoading(false)
        onCounts({ reviews: leader ? result.menunggu_pimpinan : result.statuses.pending.count + result.statuses.revision.count - result.revisi_operator, corrections: result.statuses.revision.count })
      }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false); onCounts({ reviews: 0, corrections: 0 }) }
    })
    return () => controller.abort()
  }, [attempt, leader, onCounts])
  function refresh() { setError(''); setLoading(true); setAttempt(value => value + 1) }
  if (loading) return <section className="dash-card work-panel" role="status">Memuat dashboard unit…</section>
  if (error) return <section className="dash-card work-panel" role="alert"><p>{error}</p><Button secondary onClick={refresh}>Coba lagi</Button></section>
  if (!data) return null
  const latest = data.latest.filter(record => `${record.nomor_pengajuan} ${submissionStatuses[record.status]} ${submissionStages[record.current_position]}`.toLowerCase().includes(search.toLowerCase()))
  const money = value => formatPagu(value).replace(/\s+/g, ' ')
  return <div className="governance-page unit-dashboard">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">DASHBOARD {leader ? 'PIMPINAN UNIT' : 'OPERATOR'}</span><h1>{data.unit.unit_kerja}</h1><p>Selamat datang, {user.name || user.email}. Ringkasan pengajuan sesuai kewenangan akun Anda, seluruh periode yang tersedia.</p><span className="integration-pill">Data backend</span></div><div className="work-actions"><Button secondary onClick={refresh}>Muat ulang</Button>{!leader && <Button icon="plus" onClick={() => { window.location.hash = '/formulir-usulan' }}>Buat Pengajuan</Button>}</div></section>
    <div className="unit-money-grid"><Metric label="Sisa Pagu Unit" value={money(data.saldo_pagu)} detail="Saldo tersimpan, sudah dikurangi pengajuan" icon="wallet"/><Metric label="Nominal Pengajuan" value={money(data.nominal_pengajuan)} detail={`${data.jumlah_pengajuan} pengajuan dalam cakupan akun`} icon="file"/></div>
    <div className="unit-count-grid"><Metric label={leader ? 'Menunggu Pimpinan' : 'Dalam Proses'} value={leader ? data.menunggu_pimpinan : data.statuses.pending.count} detail={leader ? 'Pengajuan aktif pada tahap Pimpinan Unit' : 'Pengajuan pending di seluruh tahap'} icon="review"/><Metric label="Disetujui" value={data.statuses.approved.count} detail={money(data.statuses.approved.amount)} icon="shield" tone="success"/><Metric label="Perlu Revisi" value={data.statuses.revision.count} detail={leader ? 'Revisi dalam cakupan pemeriksaan Anda' : `${data.revisi_operator} kembali di tahap Operator`} icon="info"/></div>
    <div className="unit-data-grid"><section className="dash-card work-panel"><div className="work-section-title"><h2>Saldo per Sumber Dana</h2><Button secondary onClick={() => { window.location.hash = '/pagu-iku' }}>Lihat Pagu</Button></div><div className="unit-source-list">{data.sources.map(source => <div key={source.jenis_pagu}><span>{source.jenis_pagu}</span><strong>{money(source.saldo)}</strong></div>)}</div>{!data.sources.length && <Empty>Unit Anda belum memiliki alokasi pagu.</Empty>}</section>
      <section className="dash-card work-panel"><h2>Status Pengajuan</h2><div className="unit-status-list">{Object.entries(submissionStatuses).map(([status, label]) => <div key={status}><span>{label}</span><strong>{data.statuses[status].count}</strong><small>{money(data.statuses[status].amount)}</small></div>)}</div></section></div>
    <section className="dash-card work-panel unit-latest"><div className="work-section-title"><div><h2>Pengajuan Terbaru</h2><p>Lima pengajuan terbaru dalam kewenangan akun Anda.</p></div><Button secondary onClick={() => { window.location.hash = '/usulan-anggaran' }}>Semua Pengajuan</Button></div><Table caption="Pengajuan terbaru unit" headers={['Nomor Pengajuan', 'Total', 'Status / Tahap', 'Tindakan']}>{latest.map(record => <tr key={record.pengajuan_id}><td>{record.nomor_pengajuan}</td><td className="numeric">{money(record.total_nominal_pengajuan)}</td><td>{submissionStatuses[record.status] || record.status}<small>{submissionStages[record.current_position] || record.current_position}</small></td><td><Button secondary onClick={() => { window.location.hash = `/usulan-anggaran?pengajuan=${encodeURIComponent(record.pengajuan_id)}` }}>Lihat Detail</Button></td></tr>)}</Table>{!latest.length && <Empty>{data.latest.length ? 'Tidak ada pengajuan terbaru yang sesuai pencarian.' : 'Belum ada pengajuan dalam kewenangan akun Anda.'}</Empty>}<small className="unit-updated">Diperbarui {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.updated_at))}</small></section>
  </div>
}
