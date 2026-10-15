import Modal from '../../components/feedback/Modal'
import StatusBadge from '../../components/data-display/StatusBadge'
import { formatMoney } from '../../utils/format'
import { DEMO_UNIT } from './demoData'

export default function ProposalDetail({ proposal, onClose, onEdit, canEdit }) {
  return <Modal title="Detail Usulan Anggaran" onClose={onClose} wide>
    <div className="detail-title"><span className="proposal-number">{proposal.id}</span><StatusBadge status={proposal.status} stage={proposal.stage} /><h3>{proposal.title}</h3></div>
    <dl className="detail-grid"><div><dt>Unit kerja</dt><dd>{DEMO_UNIT}</dd></div><div><dt>Tahun anggaran</dt><dd>2027</dd></div><div><dt>Pengusul</dt><dd>{proposal.proposer}</dd></div><div><dt>Sumber dana</dt><dd>{proposal.source}</dd></div><div><dt>Nominal usulan</dt><dd className="detail-amount">{formatMoney(proposal.amount)}</dd></div><div><dt>Kode akun</dt><dd>MAK {proposal.account} · {proposal.category}</dd></div><div><dt>Terakhir diperbarui</dt><dd>{proposal.updated}</dd></div></dl>
    {proposal.note && <div className="modal-callout warning"><strong>Catatan koreksi</strong><p>{proposal.note}</p></div>}
    <div className="modal-callout">Data contoh untuk pratinjau dashboard. Rincian item, kontribusi IKU, dan riwayat pemeriksaan belum tersedia pada prototipe ini.</div>
    <div className="modal-actions"><button className="dash-button secondary" onClick={onClose}>Tutup</button>{canEdit && <button className="dash-button" onClick={() => onEdit(proposal)}>Ubah Usulan</button>}</div>
  </Modal>
}
