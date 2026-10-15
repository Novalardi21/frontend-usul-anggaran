import { useRef, useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { STAGES } from '../dashboard/demoData'
import { REVIEW_STAGES, reviewAction } from './reviewData'

export default function DecisionDialog({ proposal, role, decision, onConfirm, onClose }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const lock = useRef(false)
  const returning = decision === 'return'
  const destination = REVIEW_STAGES[REVIEW_STAGES.indexOf(role) + (returning ? -1 : 1)]
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const data = new FormData(event.currentTarget)
    const note = String(data.get('note') || '').trim()
    if (returning && !note) { setError('Tuliskan alasan dan bagian yang perlu diperbaiki.'); event.currentTarget.elements.note.focus(); return }
    if (!returning && !data.get('confirmed')) { setError('Konfirmasi bahwa rincian dan dokumen usulan telah Anda tinjau.'); return }
    lock.current = true; setLoading(true); setError('')
    try { await new Promise(resolve => setTimeout(resolve, 250)); onConfirm(decision, note) }
    catch (err) { setError(err.message); lock.current = false; setLoading(false) }
  }
  return <Modal title={returning ? 'Kembalikan untuk Koreksi' : `${reviewAction(role)} Usulan`} busy={loading} onClose={onClose}>
    <p className="modal-intro"><strong>{proposal.id}</strong><br />{returning ? `Usulan dikembalikan satu tahap ke ${STAGES[destination]}.` : destination ? `Usulan diteruskan ke ${STAGES[destination]}.` : 'Usulan menjadi tervalidasi dan rincian terkunci.'}</p>
    <form className="review-decision-form" onSubmit={submit} noValidate aria-busy={loading}><label htmlFor="decision-note">{returning ? 'Alasan pengembalian *' : 'Catatan pemeriksaan (opsional)'}</label><textarea id="decision-note" name="note" rows={4} maxLength={2000} required={returning} aria-invalid={!!error} aria-describedby="decision-error" placeholder={returning ? 'Jelaskan bagian yang perlu dikoreksi…' : 'Tambahkan catatan hasil pemeriksaan…'} />
      {!returning && <label className="review-confirm"><input type="checkbox" name="confirmed" />Saya telah meninjau rincian anggaran, rencana IKU, dan jadwal penarikan.</label>}
      {error && <p className="field-error" id="decision-error" role="alert">{error}</p>}
      <div className="modal-callout">Aksi ini hanya mengubah data contoh di browser. Riwayat dan snapshot siklus sebelumnya tetap dipertahankan.</div>
      <div className="modal-actions"><button type="button" className="dash-button secondary" onClick={onClose} disabled={loading}>Batal</button><button className={`dash-button ${returning ? 'review-return' : 'review-approve'}`} type="submit" disabled={loading}>{loading ? 'Memproses…' : returning ? 'Kembalikan Usulan' : `Konfirmasi ${reviewAction(role)}`}</button></div>
    </form>
  </Modal>
}
