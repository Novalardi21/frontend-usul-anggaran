import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import StatusBadge from '../../components/data-display/StatusBadge'
import { formatMoney } from '../../utils/format'
import { filterProposals, isActionable } from '../budget-proposals/selectors'

const pageSize = 5
export default function ProposalTable({ proposals, search, filter, onFilter, onDetail, onEdit, role, year, section }) {
  const [page, setPage] = useState(1)
  const actionable = item => isActionable(item, role)
  const tabs = [
    { id: 'ALL', label: 'Semua', count: proposals.length },
    { id: 'TASKS', label: 'Tugas Saya', count: proposals.filter(actionable).length },
    { id: 'DALAM_PROSES', label: 'Dalam Proses', count: proposals.filter(item => item.status === 'DALAM_PROSES').length },
    { id: 'TERVALIDASI', label: 'Tervalidasi', count: proposals.filter(item => item.status === 'TERVALIDASI').length },
    { id: 'DRAF', label: 'Draf', count: proposals.filter(item => item.status === 'DRAF').length },
    { id: 'KOREKSI', label: 'Perlu Koreksi', count: proposals.filter(item => item.status === 'KOREKSI').length },
  ]
  const filtered = filterProposals(proposals, { search, status: filter, role })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)
  const title = section === 'corrections' ? 'Antrean Koreksi' : section === 'reviews' ? 'Antrean Pemeriksaan' : section === 'proposals' ? 'Daftar Usulan Anggaran' : 'Daftar Usulan & Antrean Terkini'
  return <section className="dash-card proposal-section" id="proposal-table" aria-labelledby="proposal-title"><div className="proposal-heading"><div><h2 id="proposal-title">{title}</h2><p>Usulan anggaran tingkat unit kerja TA {year} · Data contoh</p></div><div className="proposal-tabs" role="group" aria-label="Filter status usulan">{tabs.map(tab => <button key={tab.id} type="button" aria-pressed={filter === tab.id} className={filter === tab.id ? 'selected' : ''} onClick={() => { setPage(1); onFilter(tab.id) }}>{tab.label} <span>{tab.count}</span></button>)}</div></div>
    {filter === 'KOREKSI' && <div className="table-filter-note"><Icon name="alert" />Menampilkan usulan yang memerlukan koreksi.<button className="text-button" onClick={() => onFilter('ALL')}>Tampilkan semua</button></div>}
    <div className="table-scroll"><table className="proposal-table"><caption className="sr-only">Data contoh usulan anggaran POLINDRA tahun {year}</caption><thead><tr><th>Nomor Usulan</th><th>Nama Kegiatan<br />& Pengusul</th><th>Sumber Dana</th><th className="numeric">Nominal Usulan</th><th>Status & Tahapan</th><th>Terakhir Update</th><th className="action-cell">Aksi</th></tr></thead><tbody>{rows.map(item => <tr key={item.id} className={item.status === 'KOREKSI' ? 'correction-row' : ''}><td><button className="proposal-number" onClick={() => onDetail(item)}>{item.id}</button><small>MAK {item.account} ({item.category})</small></td><td><strong className="proposal-name">{item.title}</strong><span className="proposer">Pengusul: {item.proposer}</span></td><td><span className={`source-pill ${item.source.toLowerCase()}`}>{item.source}</span></td><td className={`numeric amount-cell${item.status === 'TERVALIDASI' ? ' validated-amount' : ''}`}>{formatMoney(item.amount)}</td><td><StatusBadge status={item.status} stage={item.stage} /></td><td className="updated-cell">{item.updated}</td><td className="action-cell">{role === 'OPERATOR' && ['KOREKSI', 'DRAF'].includes(item.status) ? <button className={`row-action${item.status === 'KOREKSI' ? ' correction-action' : ''}`} onClick={() => onEdit(item)}><Icon name="edit" />{item.status === 'KOREKSI' ? 'Perbaiki' : 'Ubah'}</button> : <button className="row-action" onClick={() => onDetail(item)}><Icon name="eye" />Lihat</button>}</td></tr>)}</tbody></table>{!rows.length && <div className="table-empty"><Icon name="search" /><h3>Tidak ada usulan ditemukan</h3><p>{year !== '2027' ? `Data contoh untuk tahun ${year} belum tersedia.` : 'Coba kata kunci atau filter status yang berbeda.'}</p><button className="dash-button secondary" onClick={() => onFilter('ALL')}>Reset filter status</button></div>}</div>
    <div className="table-pagination"><p>Menampilkan <strong>{filtered.length ? start + 1 : 0}–{Math.min(start + pageSize, filtered.length)}</strong> dari <strong>{filtered.length}</strong> usulan</p><div><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Sebelumnya</button>{Array.from({ length: totalPages }, (_, index) => <button key={index} aria-label={`Halaman ${index + 1}`} aria-current={safePage === index + 1 ? 'page' : undefined} className={safePage === index + 1 ? 'current' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Berikutnya<Icon name="chevron" /></button></div></div>
  </section>
}
