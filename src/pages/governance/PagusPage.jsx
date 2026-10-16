import { useEffect, useState } from 'react'
import { pagusService, paguAmount, formatPagu, selectPagus } from '../../services/pagus'
import { Button, Empty, Metric, Notice, Table } from '../../features/governance/Workbench'
import './pagus.css'

export default function PagusPage({ role, search }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [unit, setUnit] = useState('')
  const [source, setSource] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    pagusService.list(role, controller.signal).then(data => {
      data.forEach(record => paguAmount(record.nominal_pagu))
      if (!controller.signal.aborted) { setRecords(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [role, attempt])
  function refresh() { setError(''); setLoading(true); setAttempt(value => value + 1) }
  const rows = selectPagus(records, { search, unit, source })
  const units = [...new Map(records.map(record => [String(record.kode_unit_kerja), record.unit_kerja?.unit_kerja || `Unit ${record.kode_unit_kerja}`])).entries()]
  const sources = [...new Set(records.map(record => record.jenis_pagu))]
  const total = rows.reduce((sum, record) => sum + paguAmount(record.nominal_pagu), 0n)
  return <div className="governance-page pagu-page">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">ANGGARAN</span><h1>Daftar Pagu</h1><p>{['OPERATOR', 'PIMPINAN'].includes(role) ? 'Saldo pagu unit kerja akun Anda.' : 'Saldo pagu lintas unit kerja.'}</p><span className="integration-pill">Data backend</span></div><Button secondary disabled={loading} onClick={refresh}>Muat ulang</Button></section>
    <Notice>Daftar ini menampilkan saldo pagu tersimpan setelah pengurangan oleh pengajuan. Pagu belum dipisahkan menurut tahun, sehingga pilihan tahun di atas tidak memfilter daftar ini. Perhitungan dashboard dan target IKU masih menggunakan data contoh.</Notice>
    <section className="dash-card work-panel pagu-body" aria-busy={loading}>
      {loading ? <p role="status">Memuat daftar pagu…</p> : error ? <div role="alert"><p>{error}</p><Button secondary onClick={refresh}>Coba lagi</Button></div> : <>
        <div className="pagu-filters"><label>Unit Kerja<select value={unit} onChange={event => setUnit(event.target.value)}><option value="">Semua unit dalam cakupan</option>{units.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Sumber Dana<select value={source} onChange={event => setSource(event.target.value)}><option value="">Semua sumber dana</option>{sources.map(name => <option key={name} value={name}>{name}</option>)}</select></label><Button secondary onClick={() => { setUnit(''); setSource('') }}>Reset Filter</Button></div>
        <div className="pagu-summary"><Metric label="Saldo Pagu Hasil Filter" value={formatPagu(total).replace(/\s+/g, ' ')} detail={`${rows.length} data pagu`} icon="wallet"/><Metric label="Unit Kerja Hasil Filter" value={new Set(rows.map(record => record.kode_unit_kerja)).size} detail="Sesuai cakupan akun dan filter" icon="building"/></div>
        <div className="pagu-table"><Table caption="Saldo pagu dari database" headers={['Unit Kerja', 'Sumber Dana', 'Saldo Pagu (Rp)']}>{rows.map(record => <tr key={record.id}><td>{record.unit_kerja?.unit_kerja || `Unit ${record.kode_unit_kerja}`}<small>Kode {record.kode_unit_kerja}</small></td><td>{record.jenis_pagu}</td><td className="numeric">{formatPagu(record.nominal_pagu)}</td></tr>)}</Table></div>
        {!rows.length && <Empty>{records.length ? 'Tidak ada pagu yang sesuai pencarian atau filter.' : 'Belum ada data pagu dalam cakupan akun Anda.'}</Empty>}
      </>}
    </section>
  </div>
}
