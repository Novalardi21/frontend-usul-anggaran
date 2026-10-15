import { useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { formatMoney } from '../../utils/format'

export default function ProposalEditor({ proposal, remaining, onSave, onClose }) {
  const [errors, setErrors] = useState({})
  const [amount, setAmount] = useState(proposal?.amount || '')
  function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const nextErrors = {}
    if (!values.title.trim()) nextErrors.title = 'Nama kegiatan wajib diisi.'
    if (!values.proposer.trim()) nextErrors.proposer = 'Nama pengusul wajib diisi.'
    if (!values.amount || !Number.isSafeInteger(Number(values.amount)) || Number(values.amount) <= 0) nextErrors.amount = 'Masukkan nominal rupiah bulat yang lebih besar dari nol.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { event.currentTarget.elements.namedItem(Object.keys(nextErrors)[0]).focus(); return }
    onSave({ ...proposal, title: values.title.trim(), proposer: values.proposer.trim(), source: values.source, amount: Number(values.amount) })
  }
  return <Modal title={proposal ? 'Ubah Usulan Anggaran' : 'Buat Usulan Baru'} onClose={onClose}>
    <p className="modal-intro">Simulasi header draf. Rincian item, IKU, dan jadwal penarikan akan dilengkapi pada modul usulan.</p>
    {proposal?.note && <div className="modal-callout warning"><strong>Catatan pemeriksa</strong><p>{proposal.note}</p></div>}
    <form className="proposal-editor" noValidate onSubmit={submit}>
      <label htmlFor="draft-title">Nama kegiatan <span>*</span></label><input id="draft-title" name="title" defaultValue={proposal?.title || ''} maxLength={180} required aria-invalid={!!errors.title} aria-describedby={errors.title ? 'draft-title-error' : undefined} />{errors.title && <p className="field-error" id="draft-title-error">{errors.title}</p>}
      <label htmlFor="draft-proposer">Pengusul <span>*</span></label><input id="draft-proposer" name="proposer" defaultValue={proposal?.proposer || 'Siti Rahmawati'} maxLength={100} required aria-invalid={!!errors.proposer} aria-describedby={errors.proposer ? 'draft-proposer-error' : undefined} />{errors.proposer && <p className="field-error" id="draft-proposer-error">{errors.proposer}</p>}
      <label htmlFor="draft-source">Sumber dana</label><select id="draft-source" name="source" defaultValue={proposal?.source || 'BOPTN'}><option>BOPTN</option><option>PNBP</option></select>
      <label htmlFor="draft-amount">Estimasi nominal (Rp) <span>*</span></label><input id="draft-amount" name="amount" inputMode="numeric" type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} required aria-invalid={!!errors.amount} aria-describedby="draft-amount-help draft-amount-error" /><small id="draft-amount-help">{formatMoney(Number(amount) || 0)} · Sisa pagu unit {formatMoney(remaining)}</small><p className="field-error" id="draft-amount-error">{errors.amount}</p>
      <div className="modal-callout">Draf belum mengikat pagu. Data simulasi disimpan selama dashboard terbuka dan akan direset saat halaman dimuat ulang.</div>
      <div className="modal-actions"><button className="dash-button secondary" type="button" onClick={onClose}>Batal</button><button className="dash-button" type="submit">Simpan {proposal ? 'Perubahan' : 'Draf'}</button></div>
    </form>
  </Modal>
}
