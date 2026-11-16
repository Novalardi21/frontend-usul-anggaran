import { useEffect, useRef, useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'
import { pengajuansService, submissionStatuses, submissionStages, canVerifySubmission, canRepairSubmission } from '../../services/pengajuans'
import { formatPagu, paguAmount } from '../../services/pagus'
import SubmissionPosition from '../../features/approvals/SubmissionPosition'

export default function SubmissionDetail({ id, role, onClose, onDecision }) {
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [decision, setDecision] = useState('')
  const [note, setNote] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    pengajuansService.detail(id, controller.signal).then(data => {
      paguAmount(data.total_nominal_pengajuan)
      data.items.forEach(item => { paguAmount(item.nominal_satuan); paguAmount(item.total_nominal) })
      if (!controller.signal.aborted) { setRecord(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [id, attempt])
  async function confirm(event) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setSaving(true)
    setDecisionError('')
    try {
      const result = await pengajuansService.verify(record, decision, note)
      onDecision(result)
    } catch (reason) { setDecisionError(reason.message) }
    finally { submitting.current = false; setSaving(false) }
  }
  return <Modal title="Detail Pengajuan" eyebrow="SIPADU · DATA BACKEND" wide busy={saving} onClose={onClose}>
    {loading ? <p role="status">Memuat detail pengajuan…</p> : error ? <div role="alert"><p>{error}</p><Button secondary onClick={() => { setError(''); setLoading(true); setAttempt(value => value + 1) }}>Coba lagi</Button></div> : record && <div className="submission-detail">
      <dl className="submission-metadata">
        <div><dt>Nomor Pengajuan</dt><dd>{record.nomor_pengajuan}</dd></div><div><dt>Unit Kerja</dt><dd>{record.unit_kerja?.unit_kerja || `Unit ${record.kode_unit_kerja}`}</dd></div>
        <div><dt>Pengaju</dt><dd>{record.operator?.nama_operator || '—'}</dd></div><div><dt>Status / Tahap</dt><dd>{submissionStatuses[record.status] || record.status} · {submissionStages[record.current_position] || record.current_position}</dd></div>
        <div><dt>Total Pengajuan</dt><dd>{formatPagu(record.total_nominal_pengajuan)}</dd></div><div><dt>Jumlah Rincian</dt><dd>{record.items.length} item</dd></div>
      </dl>
      <SubmissionPosition record={record}/>
      {record.catatan_revisi && <section className="submission-note"><h3>Catatan Revisi</h3><p>{record.catatan_revisi}</p></section>}
      {canRepairSubmission(record, role) && <div className="work-actions"><a className="dash-button" href={`#/formulir-usulan?perbaiki=${encodeURIComponent(record.pengajuan_id)}`}>Perbaiki & Ajukan Ulang</a></div>}
      <Table caption="Rincian anggaran pengajuan" headers={['Akun / Hierarki', 'Volume', 'Satuan', 'Harga Satuan', 'Total']}>{record.items.map(item => <tr key={item.id}><td>{item.nama_item && <div><strong>{item.nama_item}</strong></div>}<strong>{item.kode_akun}</strong> {item.nama_akun}<small>Program {item.kode_program} · Kegiatan {item.kode_kegiatan}</small><small>Output {item.kode_output} · Suboutput {item.kode_so} · Subkomponen {item.kode_sk}{item.kode_komponen && " · Komponen " + item.kode_komponen}</small>{item.kode_iku && <small>{item.kode_iku} · Target {item.target_iku}</small>}</td><td>{item.volume}</td><td>{item.nama_satuan || item.kode_satuan}</td><td className="numeric">{formatPagu(item.nominal_satuan)}</td><td className="numeric">{formatPagu(item.total_nominal)}</td></tr>)}</Table>
      {!record.items.length && <Empty>Pengajuan ini belum memiliki rincian anggaran.</Empty>}
      {onDecision && canVerifySubmission(record, role) && <section className="submission-decision">
        <h3>Keputusan Pemeriksaan</h3>
        {!decision ? <div className="work-actions"><Button onClick={() => { setDecisionError(''); setDecision('approve') }}>{role === 'KPA' ? 'Setujui Final' : 'Setujui & Teruskan'}</Button><Button secondary onClick={() => { setDecisionError(''); setDecision('revise') }}>Kembalikan dengan Catatan</Button></div> : <form className="work-form" onSubmit={confirm} aria-busy={saving}>
          <p>{decision === 'approve' ? role === 'KPA' ? 'Konfirmasi persetujuan final? Pengajuan akan dinyatakan selesai.' : 'Konfirmasi persetujuan dan teruskan pengajuan ke tahap berikutnya?' : 'Pengajuan akan dikembalikan satu tahap. Saldo pagu tetap seperti saat pengajuan dikirim.'}</p>
          {decision === 'revise' && <label>Alasan Pengembalian *<textarea value={note} onChange={event => setNote(event.target.value)} required maxLength={5000} rows={4} disabled={saving}/></label>}
          {decisionError && <p className="work-error" role="alert">{decisionError}</p>}
          <div className="work-actions"><Button secondary disabled={saving} onClick={() => { setDecision(''); setDecisionError('') }}>Batal</Button><button className="dash-button" type="submit" disabled={saving}>{saving ? 'Menyimpan Keputusan…' : decision === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Pengembalian'}</button></div>
          {!saving && decisionError && <Button secondary onClick={() => { setDecision(''); setDecisionError(''); setError(''); setLoading(true); setAttempt(value => value + 1) }}>Muat Ulang Detail</Button>}
        </form>}
      </section>}
    </div>}
  </Modal>
}
