import { useEffect, useRef, useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { Button } from '../../features/governance/Workbench'
import { pagusService, formatPagu } from '../../services/pagus'

export default function PaguDialog({ record, onSaved, onClose }) {
  const [options, setOptions] = useState({ units: [], sources: [] })
  const [loading, setLoading] = useState(!record)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const submitting = useRef(false)
  useEffect(() => {
    if (record) return
    const controller = new AbortController()
    pagusService.options(controller.signal).then(data => {
      if (!controller.signal.aborted) { setOptions(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setLoadError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [record, attempt])
  async function submit(event) {
    event.preventDefault()
    if (submitting.current || loading || loadError) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      await pagusService.save(values, record)
      onSaved(record ? 'Saldo pagu berhasil diperbarui.' : 'Pagu berhasil ditambahkan.')
    } catch (reason) { setError(reason.message) }
    finally { submitting.current = false; setSaving(false) }
  }
  return <Modal title={record ? 'Ubah Saldo Pagu' : 'Tambah Pagu'} eyebrow="SIPADU · DATA BACKEND" busy={saving} onClose={onClose}>
    {loading ? <p role="status">Memuat referensi unit dan sumber dana…</p> : loadError ? <div role="alert"><p>{loadError}</p><Button secondary onClick={() => { setLoadError(''); setLoading(true); setAttempt(value => value + 1) }}>Coba lagi</Button></div> : <form className="work-form" onSubmit={submit} onChange={() => setError('')} aria-busy={saving}>
      <p>{record ? `Saldo saat ini: ${formatPagu(record.nominal_pagu)}. Isi saldo baru secara keseluruhan, bukan nominal tambahan. Unit kerja dan sumber dana tetap.` : 'Pilih unit dan sumber dana, lalu isi saldo pagu dalam rupiah tanpa titik atau koma. Sumber dana baru otomatis didaftarkan.'}</p>
      {record ? <><label>Unit Kerja<input value={record.unit_kerja?.unit_kerja || `Unit ${record.kode_unit_kerja}`} readOnly/></label><label>Sumber Dana<input value={record.jenis_pagu} readOnly/></label></> : <>
        <label>Unit Kerja *<select name="kode_unit_kerja" required defaultValue="" disabled={saving}><option value="" disabled>Pilih unit kerja</option>{options.units.map(unit => <option key={unit.kode_unit_kerja} value={unit.kode_unit_kerja}>{unit.unit_kerja}</option>)}</select></label>
        {!options.units.length && <p className="work-error">Belum ada unit kerja. Tambahkan unit melalui menu Daftar Unit Kerja.</p>}
        <label>Sumber Dana *<input name="jenis_pagu" list="pagu-source-options" required maxLength={255} placeholder="Contoh: PNBP, BOPTN, RM" disabled={saving}/><datalist id="pagu-source-options">{options.sources.map(source => <option key={source.jenis_pagu} value={source.jenis_pagu}/>)}</datalist></label>
      </>}
      <label>Saldo Pagu Baru (Rp) *<input name="nominal_pagu" type="text" inputMode="numeric" pattern="[0-9]+" maxLength={19} required defaultValue={record ? String(record.nominal_pagu) : ''} disabled={saving} placeholder="Contoh: 100000000"/></label>
      {error && <p className="work-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button secondary onClick={onClose} disabled={saving}>Batal</Button><button type="submit" className="dash-button" disabled={saving || (!record && !options.units.length)}>{saving ? 'Menyimpan…' : 'Simpan'}</button></div>
    </form>}
  </Modal>
}
