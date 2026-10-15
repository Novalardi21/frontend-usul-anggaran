import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import StatusBadge from '../../components/data-display/StatusBadge'
import ReviewDetail from '../../features/approvals/ReviewDetail'
import { canReview } from '../../features/approvals/reviewData'
import { filterProposals } from '../../features/budget-proposals/selectors'
import { STAGES } from '../../features/dashboard/demoData'
import { formatMoney } from '../../utils/format'
import './reviews.css'

function readSelectedId() { return new URLSearchParams(window.location.hash.split('?')[1] || '').get('usulan') }

export default function ReviewQueuePage({ proposals, year, onYearChange, role, search, onSearchChange, onDecision }) {
  const [selectedId, setSelectedId] = useState(readSelectedId)
  const [onlyMine, setOnlyMine] = useState(false)
  const [stage, setStage] = useState('ALL')
  useEffect(() => {
    const onHashChange = () => setSelectedId(readSelectedId())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const all = proposals.filter(item => item.status === 'DALAM_PROSES')
  const mine = all.filter(item => canReview(item, role))
  const queue = filterProposals(onlyMine ? mine : all, { stage, search })
  const selected = proposals.find(item => item.id === selectedId)
  function open(item) { setSelectedId(item.id); window.location.assign(`#/antrean-pemeriksaan?usulan=${encodeURIComponent(item.id)}`); window.scrollTo(0, 0) }
  function back() { setSelectedId(null); window.location.assign('#/antrean-pemeriksaan'); window.scrollTo(0, 0) }
  if (selected) return <ReviewDetail proposal={selected} proposals={proposals} role={role} onBack={back} onDecision={onDecision} />
  return <div className="review-queue-page">
    <section className="dash-card review-queue-heading"><div><span className="proposals-eyebrow">PEMERIKSAAN & PERSETUJUAN</span><h1>Antrean Pemeriksaan</h1><p>Tinjau rincian dan kelengkapan usulan sebelum diteruskan ke tahap berikutnya.</p><span className="demo-tag"><Icon name="info" />Data contoh · Cakupan sesuai peran akun</span></div><label><Icon name="calendar" /><select aria-label="Tahun antrean pemeriksaan" value={year} onChange={event => onYearChange(event.target.value)}><option value="2027">TA 2027</option><option value="2026">TA 2026</option><option value="2025">TA 2025</option></select></label></section>
    {selectedId && <div className="year-empty-notice"><Icon name="info" />Usulan tidak tersedia pada tahun yang dipilih.<button className="text-button" onClick={back}>Kembali ke antrean</button></div>}
    <div className="review-queue-summary"><article className="dash-card"><span className="stat-icon tone-info"><Icon name="review" /></span><div><span>Dalam pemeriksaan</span><strong>{all.length}<small>usulan</small></strong></div></article><article className="dash-card"><span className="stat-icon tone-primary"><Icon name="user" /></span><div><span>Menunggu tindakan Anda</span><strong>{mine.length}<small>usulan</small></strong></div></article><article className="dash-card"><span className="stat-icon tone-success"><Icon name="coin" /></span><div><span>Nominal antrean</span><strong className="queue-summary-money">{formatMoney(all.reduce((sum, item) => sum + item.amount, 0))}</strong></div></article></div>
    {role === 'OPERATOR' && <div className="review-readonly-notice"><Icon name="shield" /><p><strong>Akses Operator: pantau progres pemeriksaan.</strong> Anda dapat membaca detail. Keputusan dilakukan oleh Pimpinan Unit, SAKIP, SPI, atau KPA sesuai tahap aktif. Untuk mencoba keputusan dummy, pilih peran pemeriksa saat login.</p></div>}
    <section className="dash-card review-queue-table"><div className="review-queue-toolbar"><div className="proposal-tabs" role="group" aria-label="Cakupan antrean"><button className={!onlyMine ? 'selected' : ''} aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>Semua Antrean ({all.length})</button><button className={onlyMine ? 'selected' : ''} aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>Tugas Saya ({mine.length})</button></div><label><span className="sr-only">Filter tahap pemeriksaan</span><select value={stage} onChange={event => setStage(event.target.value)}><option value="ALL">Semua tahap</option>{['PIMPINAN', 'SAKIP', 'SPI', 'KPA'].map(value => <option value={value} key={value}>{STAGES[value]}</option>)}</select></label></div><label className="review-queue-search"><Icon name="search" /><input type="search" aria-label="Cari antrean pemeriksaan" placeholder="Cari nomor, nama kegiatan, atau pengusul…" value={search} onChange={event => onSearchChange(event.target.value)} /></label>
      <div className="table-scroll"><table className="proposal-table review-list-table"><caption className="sr-only">Daftar antrean pemeriksaan contoh tahun {year}</caption><thead><tr><th>Nomor Usulan</th><th>Kegiatan & Pengusul</th><th>Sumber</th><th className="numeric">Nominal Usulan</th><th>Tahap Aktif</th><th className="action-cell">Aksi</th></tr></thead><tbody>{queue.map(item => <tr key={item.id}><td><button className="proposal-number" onClick={() => open(item)}>{item.id}</button><small>{item.updated}</small></td><td><strong className="proposal-name">{item.title}</strong><span className="proposer">{item.proposer}</span></td><td><span className={`source-pill ${item.source.toLowerCase()}`}>{item.source}</span></td><td className="numeric amount-cell">{formatMoney(item.amount)}</td><td><StatusBadge status={item.status} stage={item.stage} /></td><td className="action-cell"><button className={`dash-button${canReview(item, role) ? '' : ' secondary'}`} onClick={() => open(item)}><Icon name={canReview(item, role) ? 'review' : 'eye'} />{canReview(item, role) ? 'Periksa' : 'Lihat Detail'}</button></td></tr>)}</tbody></table></div>
      {!queue.length && <div className="table-empty"><Icon name="review" /><h3>Tidak ada antrean pemeriksaan</h3><p>{year !== '2027' ? `Data contoh TA ${year} belum tersedia.` : onlyMine ? 'Tidak ada usulan pada tahap pemeriksaan peran Anda.' : 'Tidak ada usulan yang sesuai pencarian dan filter.'}</p><button className="dash-button secondary" onClick={() => { setOnlyMine(false); setStage('ALL'); onSearchChange('') }}>Tampilkan Semua Antrean</button></div>}<div className="review-queue-table-footer">Menampilkan {queue.length} dari {all.length} usulan dalam proses · Data contoh</div>
    </section>
  </div>
}

