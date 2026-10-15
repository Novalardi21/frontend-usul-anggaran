import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import ProposalTable from '../../features/dashboard/ProposalTable'
import { DEMO_UNIT, STAGES } from '../../features/dashboard/demoData'
import { filterProposals } from '../../features/budget-proposals/selectors'
import { formatMoney, formatNumber } from '../../utils/format'
import { exportProposals } from '../../utils/exportCsv'
import './proposals.css'

export default function ProposalsPage({ proposals, year, onYearChange, search, onSearchChange, filter, onFilter, role, remaining, onCreate, onDetail, onEdit, onExport }) {
  const [source, setSource] = useState('ALL')
  const [stage, setStage] = useState('ALL')
  const [sort, setSort] = useState('default')
  const scoped = filterProposals(proposals, { source, stage, sort })
  const visible = filterProposals(scoped, { search, status: filter, role })
  const totalAmount = proposals.reduce((sum, item) => sum + item.amount, 0)
  const stats = [
    { label: 'Semua Usulan', status: 'ALL', icon: 'file', tone: 'primary', helper: 'Seluruh usulan unit kerja' },
    { label: 'Draf', status: 'DRAF', icon: 'edit', tone: 'neutral', helper: 'Belum mengikat pagu' },
    { label: 'Dalam Proses', status: 'DALAM_PROSES', icon: 'clock', tone: 'info', helper: 'Dalam pemeriksaan bertingkat' },
    { label: 'Perlu Koreksi', status: 'KOREKSI', icon: 'alert', tone: 'warning', helper: 'Periksa catatan pemeriksa' },
  ]
  const hasFilters = source !== 'ALL' || stage !== 'ALL' || filter !== 'ALL' || search.trim() || sort !== 'default'
  function reset() { setSource('ALL'); setStage('ALL'); setSort('default'); onFilter('ALL'); onSearchChange('') }
  function exportVisible() { exportProposals(visible, year); onExport() }

  return <div className="proposals-page">
    <section className="dash-card proposals-page-header"><div><span className="proposals-eyebrow">PERENCANAAN & PENGANGGARAN</span><h1>Usulan Anggaran</h1><p>Kelola draf, pantau pemeriksaan, dan tindak lanjuti koreksi usulan unit kerja Anda.</p><span className="demo-tag"><Icon name="info" />Data contoh · {DEMO_UNIT}</span></div><div className="proposals-header-actions"><button className="dash-button secondary" disabled={!visible.length} onClick={exportVisible}><Icon name="download" />Ekspor CSV</button>{role === 'OPERATOR' && <button className="dash-button" disabled={year !== '2027'} onClick={onCreate}><Icon name="plus" />Buat Usulan Baru</button>}</div></section>
    <div className="proposals-summary-grid">{stats.map(stat => <button key={stat.status} className={`dash-card proposal-summary tone-${stat.tone}${filter === stat.status ? ' is-selected' : ''}`} aria-pressed={filter === stat.status} onClick={() => onFilter(stat.status)}><span className="proposal-summary-heading"><span>{stat.label}</span><span className="stat-icon"><Icon name={stat.icon} /></span></span><strong>{formatNumber(stat.status === 'ALL' ? proposals.length : proposals.filter(item => item.status === stat.status).length)}<span>usulan</span></strong><small>{stat.helper}</small></button>)}</div>
    <div className="proposals-budget-note"><span className="proposal-budget-icon"><Icon name="wallet" /></span><div><strong>Sisa pagu dapat diajukan <span>{formatMoney(remaining)}</span></strong><p>Total nominal seluruh usulan: <b>{formatMoney(totalAmount)}</b> (termasuk draf). Nominal usulan berbeda dari pagu tersedia.</p></div><span className="small-year">TA {year}</span></div>
    <section className="dash-card proposals-filter-panel" aria-labelledby="proposals-filter-title"><div className="proposals-filter-heading"><h2 id="proposals-filter-title"><Icon name="search" />Temukan Usulan</h2><button type="button" className="text-button" onClick={reset} disabled={!hasFilters}>Reset filter</button></div><div className="proposals-filters">
      <label className="proposal-search-field"><span>Cari usulan</span><span className="proposal-search-input"><Icon name="search" /><input type="search" aria-label="Cari dalam daftar usulan" placeholder="Nomor, kegiatan, pengusul, atau kode akun…" value={search} onChange={event => onSearchChange(event.target.value)} /></span></label>
      <label><span>Tahun anggaran</span><select value={year} onChange={event => onYearChange(event.target.value)}><option value="2027">TA 2027</option><option value="2026">TA 2026</option><option value="2025">TA 2025</option></select></label>
      <label><span>Sumber dana</span><select value={source} onChange={event => setSource(event.target.value)}><option value="ALL">Semua sumber</option><option value="BOPTN">BOPTN</option><option value="PNBP">PNBP</option></select></label>
      <label><span>Tahap pemeriksaan</span><select value={stage} onChange={event => setStage(event.target.value)}><option value="ALL">Semua tahap</option>{Object.entries(STAGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value="DONE">Selesai / tervalidasi</option></select></label>
      <label><span>Urutkan</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="default">Urutan bawaan</option><option value="amount-desc">Nominal terbesar</option><option value="amount-asc">Nominal terkecil</option><option value="name">Nama kegiatan A–Z</option></select></label>
    </div><div className="proposals-filter-result" role="status"><span><strong>{visible.length}</strong> dari {proposals.length} usulan sesuai filter</span><span>Total hasil: <strong>{formatMoney(visible.reduce((sum, item) => sum + item.amount, 0))}</strong></span></div></section>
    {year !== '2027' && <div className="year-empty-notice"><Icon name="info" />Data contoh TA {year} belum tersedia. Pilih TA 2027 untuk melihat usulan.</div>}
    <ProposalTable key={`${year}-${source}-${stage}-${sort}-${search}-${filter}`} proposals={scoped} search={search} filter={filter} onFilter={onFilter} onDetail={onDetail} onEdit={onEdit} role={role} year={year} section="proposals" />
    <div className="proposals-guidance"><Icon name="shield" /><p><strong>Usulan mengikuti alur pemeriksaan berjenjang.</strong> Operator → Pimpinan Unit → SAKIP → SPI → KPA/Direktur. Usulan tervalidasi terkunci; perbaikan dilakukan setelah koreksi kembali ke Operator.</p></div>
  </div>
}
