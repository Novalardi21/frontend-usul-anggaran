import { useEffect, useRef, useState } from 'react'
import { unitsService } from '../../services/units'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'

function UnitDialog({ unit, deleting = false, onSaved, onClose }) {
  const [name, setName] = useState(deleting ? '' : unit?.unit_kerja || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      if (deleting) {
        if (name !== unit.unit_kerja) throw new Error('Nama konfirmasi harus sama persis dengan nama unit.')
        await unitsService.remove(unit.kode_unit_kerja)
      } else await unitsService.save(name, unit?.kode_unit_kerja)
      onSaved(deleting ? 'Unit kerja berhasil dihapus.' : unit ? 'Nama unit kerja berhasil diperbarui.' : 'Unit kerja berhasil ditambahkan.')
    } catch (reason) {
      setError(reason.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }
  return <Modal title={deleting ? 'Hapus Unit Kerja' : unit ? 'Ubah Unit Kerja' : 'Tambah Unit Kerja'} eyebrow="SIPADU · DATA BACKEND" busy={saving} onClose={onClose}>
    <form className="work-form" onSubmit={submit} aria-busy={saving}>
      {deleting ? <p>Hapus permanen unit <strong>{unit.unit_kerja}</strong>? Unit yang masih memiliki operator, pengajuan, atau pagu akan ditolak. Ketik nama unit untuk mengonfirmasi.</p> : <p>Perubahan disimpan ke database. {unit ? 'Kode unit tetap sama.' : 'Kode unit dibuat otomatis oleh sistem.'}</p>}
      {unit && <label>Kode Unit<input value={unit.kode_unit_kerja} readOnly /></label>}
      <label htmlFor="unit-name">{deleting ? 'Ketik Nama Unit Kerja' : 'Nama Unit Kerja'} *<input id="unit-name" name="unit_kerja" value={name} onChange={event => { setName(event.target.value); setError('') }} required maxLength={255} disabled={saving} aria-invalid={Boolean(error)} aria-describedby={error ? 'unit-save-error' : undefined} /></label>
      {error && <p id="unit-save-error" className="work-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button secondary onClick={onClose} disabled={saving}>Batal</Button><button type="submit" className="dash-button" disabled={saving || (deleting && name !== unit.unit_kerja)}>{saving ? deleting ? 'Menghapus…' : 'Menyimpan…' : deleting ? 'Hapus Permanen' : 'Simpan'}</button></div>
    </form>
  </Modal>
}

export default function UnitsPage({ search, role }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const canManage = role === 'ADMIN'
  useEffect(() => {
    const controller = new AbortController()
    unitsService.list(controller.signal).then(data => {
      if (!controller.signal.aborted) { setUnits(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [attempt])
  const rows = units.filter(unit => `${unit.kode_unit_kerja} ${unit.unit_kerja}`.toLowerCase().includes(search.toLowerCase()))
  function refresh() { setError(''); setLoading(true); setAttempt(value => value + 1) }
  return <div className="governance-page">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">MASTER DATA</span><h1>Daftar Unit Kerja</h1><p>{canManage ? 'Kelola nama unit kerja yang tersimpan di database.' : 'Daftar unit kerja dari database. Perubahan dikelola oleh Admin.'}</p><span className="integration-pill">Data backend</span></div><div className="work-actions"><Button secondary onClick={refresh} disabled={loading}>Muat ulang</Button>{canManage && <Button icon="plus" onClick={() => { setNotice(''); setDialog({ unit: null }) }}>Tambah Unit Kerja</Button>}</div></section>
    {notice && <p className="work-notice" role="status">{notice}</p>}
    <section className="dash-card work-panel" aria-busy={loading}>
      {loading ? <p role="status">Memuat daftar unit kerja…</p> : error ? <div role="alert"><p>{error}</p><Button secondary onClick={refresh}>Coba lagi</Button></div> : <>
        <p>{rows.length} unit kerja hasil pencarian</p>
        <Table caption="Daftar unit kerja dari database" headers={canManage ? ['Kode Unit', 'Nama Unit Kerja', 'Tindakan'] : ['Kode Unit', 'Nama Unit Kerja']}>{rows.map(unit => <tr key={unit.kode_unit_kerja}><td>{unit.kode_unit_kerja}</td><td>{unit.unit_kerja}</td>{canManage && <td><div className="work-actions"><Button secondary icon="edit" onClick={() => { setNotice(''); setDialog({ unit }) }}>Ubah</Button><Button secondary onClick={() => { setNotice(''); setDialog({ unit, deleting: true }) }}>Hapus</Button></div></td>}</tr>)}</Table>
        {!rows.length && <Empty>{units.length ? 'Tidak ada unit yang sesuai pencarian.' : 'Belum ada unit kerja di database.'}</Empty>}
      </>}
    </section>
    {dialog && canManage && <UnitDialog unit={dialog.unit} deleting={dialog.deleting} onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message); refresh() }} />}
  </div>
}
