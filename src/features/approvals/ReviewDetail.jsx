import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/feedback/Modal'
import StatusBadge from '../../components/data-display/StatusBadge'
import { FUNDING, ROLE_NAMES, STAGES, getBudgetSummary } from '../dashboard/demoData'
import { formatMoney, formatPercent } from '../../utils/format'
import { REVIEW_STAGES, canReview, getReviewHistory, getReviewSnapshot, reviewAction } from './reviewData'
import SnapshotViewer from '../governance/SnapshotViewer'
import DecisionDialog from './DecisionDialog'

export default function ReviewDetail({ proposal, proposals, role, onBack, onDecision }) {
  const [dialog, setDialog] = useState(null)
  const snapshot = getReviewSnapshot(proposal)
  const history = getReviewHistory(proposal)
  const authorized = canReview(proposal, role)
  const source = { ...FUNDING.find(fund => fund.code === proposal.source), ceiling: proposal.sourceCeiling ?? FUNDING.find(fund => fund.code === proposal.source).ceiling }
  const summary = getBudgetSummary(proposals.filter(item => item.source === proposal.source && (item.unitId || 'TI') === (proposal.unitId || 'TI')))
  const bound = summary.validated + summary.committed
  const available = source.ceiling - bound
  const index = proposal.status === 'TERVALIDASI' ? REVIEW_STAGES.length : REVIEW_STAGES.indexOf(proposal.stage)
  const next = REVIEW_STAGES[index + 1]
  const notes = history.filter(event => event.stage !== 'OPERATOR').slice(-3).reverse()
  function confirmDecision(decision, note) { onDecision(proposal.id, decision, note); setDialog(null) }
  return <div className="review-detail">
    <div className="review-breadcrumb"><button onClick={onBack}><Icon name="review" />Antrean Pemeriksaan</button><span>/</span><span>Detail Validasi {proposal.id}</span></div>
    <div className="review-detail-heading"><div><div className="review-heading-badges"><span className="review-id">{proposal.id}</span><StatusBadge status={proposal.status} /><span className="review-stage">Tahap aktif: {STAGES[proposal.stage] || 'Selesai'}</span></div><h1>{snapshot.title}</h1><span className="demo-tag"><Icon name="info" />Data contoh · Detail pemeriksaan siklus {snapshot.cycle}</span></div><div className="review-heading-actions"><button className="dash-button secondary" onClick={() => window.print()}><Icon name="file" />Cetak Lembar Kontrol</button><button className="dash-button secondary" onClick={() => setDialog('audit')}><Icon name="clock" />Riwayat Audit</button></div></div>
    <section className="dash-card review-metadata" aria-label="Informasi usulan">{[{ icon: 'building', label: 'Unit pengusul', value: proposal.unitName || 'Teknik Informatika' }, { icon: 'wallet', label: 'Sumber anggaran', value: `${snapshot.source} TA 2027` }, { icon: 'coin', label: 'Total usulan', value: formatMoney(snapshot.amount) }, { icon: 'swap', label: 'Iterasi siklus', value: `Siklus ke-${snapshot.cycle} (Original)` }].map(meta => <div key={meta.label}><span className="review-meta-icon"><Icon name={meta.icon} /></span><div><span>{meta.label}</span><strong>{meta.value}</strong></div></div>)}</section>
    <section className="dash-card review-authority"><div><span className="review-authority-icon"><Icon name="shield" /></span><div><h2>{authorized ? `Kewenangan Peninjauan: ${ROLE_NAMES[role]}` : 'Pratinjau Pemeriksaan · Baca Saja'}</h2><p>{authorized ? 'Tinjau kepatuhan administratif, rincian biaya, rencana IKU, dan keseimbangan jadwal sebelum mengambil keputusan.' : `Akun demo Anda berperan ${ROLE_NAMES[role]}. Keputusan hanya tersedia untuk pemeriksa pada tahap ${STAGES[proposal.stage] || 'selesai'}.`}{proposal.status !== 'DALAM_PROSES' && ` Status saat ini: ${proposal.status === 'KOREKSI' ? 'perlu koreksi' : 'tervalidasi'}.`}</p></div></div><div className="review-decision-actions"><button className="dash-button review-return" disabled={!authorized} onClick={() => setDialog('return')}><Icon name="swap" />Kembalikan (Perlu Koreksi)</button><button className="dash-button review-approve" disabled={!authorized} onClick={() => setDialog('approve')}><Icon name="check" />{reviewAction(proposal.stage)} Usulan{next ? ` (Lanjut ke ${STAGES[next]})` : ''}</button></div></section>
    <div className="review-detail-grid"><div className="review-main-column">
      <section className="dash-card review-budget"><div className="review-card-heading"><h2><Icon name="chart" />Validasi Kepatuhan Pagu Sumber Dana</h2><span className="status-badge tone-success"><Icon name="check" />Sisa {formatPercent(available / source.ceiling * 100)}</span></div><div className="review-budget-meter" role="img" aria-label={`Komitmen dan tervalidasi ${formatMoney(bound)} dari pagu ${formatMoney(source.ceiling)}`}><span style={{ width: `${Math.min(100, bound / source.ceiling * 100)}%` }} /></div><div className="review-budget-labels"><span>0%</span><span>Total terikat {formatPercent(bound / source.ceiling * 100)} ({formatMoney(bound)})</span><span>100%</span></div><div className="review-budget-figures"><div><span>Pagu sumber dana</span><strong>{formatMoney(source.ceiling)}</strong><small>{source.code} · Unit TI</small></div><div><span>Komitmen & tervalidasi</span><strong>{formatMoney(bound)}</strong><small>Usulan ini dihitung satu kali</small></div><div><span>Sisa aman tersedia</span><strong>{formatMoney(available)}</strong><small>Alokasi perencanaan, bukan realisasi</small></div></div></section>
      <SnapshotViewer key={proposal.id} proposal={proposal} />
      <section className="dash-card review-justification"><div><Icon name="building" /><strong>Lab TI POLINDRA</strong><small>Kesiapan infrastruktur</small></div><article><h2>Justifikasi Kebutuhan Akademik</h2><p>{snapshot.justification}</p><span><Icon name="info" />Dokumen pendukung resmi belum terhubung pada prototipe.</span></article></section>
    </div><aside className="review-side-column">
      <section className="dash-card review-workflow"><div className="review-card-heading"><h2><Icon name="tree" />Alur Validasi Berjenjang</h2><small>Tahap {Math.min(index + 1, 5)} dari 5</small></div><ol>{REVIEW_STAGES.map((stage, stageIndex) => {
        const event = history.filter(item => item.stage === stage && item.cycle === snapshot.cycle && !['KEMBALIKAN','TERUSKAN_KOREKSI'].includes(item.action)).at(-1)
        const active = proposal.stage === stage
        return <li key={stage} className={active ? 'active' : stageIndex < index ? 'completed' : 'waiting'}><span className="workflow-dot"><Icon name={active ? 'clock' : stageIndex < index ? 'check' : 'lock'} /></span><div><div className="workflow-title"><strong>{stage === 'OPERATOR' ? 'Operator TI' : stage === 'SPI' ? 'Satuan Pengawas Internal' : stage === 'KPA' ? 'KPA / Direktur POLINDRA' : STAGES[stage]}</strong><span>{active ? proposal.status === 'KOREKSI' ? 'KOREKSI' : 'AKTIF' : stageIndex < index ? event?.action || 'SELESAI' : 'MENUNGGU'}</span></div><p>{active ? 'Tahap pemeriksaan saat ini' : event?.actor || 'Menunggu tahap sebelumnya'}</p>{event && <small>{event.time}</small>}{event?.note && !active && <blockquote>“{event.note}”</blockquote>}</div></li>
      })}</ol></section>
      <section className="dash-card review-notes"><div className="review-card-heading"><h2><Icon name="review" />Riwayat Catatan Pemeriksa</h2><span className="small-year">Siklus {snapshot.cycle}</span></div>{notes.length ? notes.map((note, noteIndex) => <article key={noteIndex}><div><strong>{STAGES[note.stage]}</strong><small>{note.time}</small></div><p>{note.note}</p></article>) : <p className="review-empty-notes">Belum ada catatan pemeriksa pada siklus ini.</p>}<div className="review-integrity"><h3>Integritas Data Usulan</h3><p>Rincian item <strong>{snapshot.items.length} item contoh</strong></p><p>Snapshot pengajuan <strong>Siklus {snapshot.cycle}</strong></p><p>Dokumen pendukung <span>Belum terhubung</span></p></div></section>
    </aside></div>
    {['approve', 'return'].includes(dialog) && <DecisionDialog proposal={proposal} role={role} decision={dialog} onConfirm={confirmDecision} onClose={() => setDialog(null)} />}
    {dialog === 'audit' && <Modal title="Riwayat Audit Pemeriksaan" wide onClose={() => setDialog(null)}><p className="modal-intro">Jejak keputusan contoh · {proposal.id} · Siklus {snapshot.cycle}</p><ol className="review-audit-list">{history.map((event, eventIndex) => <li key={eventIndex}><strong>{event.action} · {STAGES[event.stage]}</strong><small>{event.actor} · {event.time}</small><p>{event.note}</p></li>)}</ol>{!history.length && <p>Belum ada keputusan tercatat.</p>}</Modal>}
  </div>
}

