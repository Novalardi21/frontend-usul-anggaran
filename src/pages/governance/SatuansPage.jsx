import { useEffect, useRef, useState } from 'react'
import { satuansService } from '../../services/satuans'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'

function SatuanDialog({ record, deleting = false, onSaved, onClose }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  const [confirmation, setConfirmation] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      if (deleting) {
        if (confirmation !== record.nama_satuan) throw new Error('Nama konfirmasi harus sama persis dengan nama satuan.')
        await satuansService.remove(record.kode_satuan)
      } else await satuansService.save(values, record?.kode_satuan)
      onSaved(deleting ? 'Satuan berhasil dihapus.' : record ? 'Nama satuan berhasil diperbarui.' : 'Satuan berhasil ditambahkan.')
    } catch (reason) {
      setError(reason.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }
  return <Modal title={deleting ? 'Hapus Satuan' : record ? 'Ubah Satuan' : 'Tambah Satuan'} eyebrow="SIPADU · DATA BACKEND" busy={saving} onClose={onClose}>
    <form className="work-form" onSubmit={submit} aria-busy={saving} onChange={() => setError('')}>
      {deleting ? <div className="work-notice warning"><p><strong>Peringatan: penghapusan permanen.</strong> Satuan <strong>{record.nama_satuan}</strong> ({record.kode_satuan}) akan dihapus dari database dan tidak dapat dipulihkan melalui aplikasi. Satuan yang masih dipakai rincian anggaran akan ditolak. Ketik nama satuan persis untuk melanjutkan.</p></div> : <p>{record ? 'Kode satuan tetap sama agar rincian anggaran yang menggunakannya tetap terhubung.' : 'Masukkan kode dan nama satuan, misalnya kode PKT dengan nama Paket.'}</p>}
      {deleting ? <label>Ketik Nama Satuan *<input value={confirmation} onChange={event => setConfirmation(event.target.value)} required maxLength={255} disabled={saving}/></label> : <>
      <label>Kode Satuan *<input name="kode_satuan" defaultValue={record?.kode_satuan || ''} required maxLength={255} readOnly={Boolean(record)} disabled={saving}/></label>
      <label>Nama Satuan *<input name="nama_satuan" defaultValue={record?.nama_satuan || ''} required maxLength={255} disabled={saving}/></label>
      </>}
      {error && <p className="work-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button secondary onClick={onClose} disabled={saving}>Batal</Button><button className="dash-button" type="submit" disabled={saving || (deleting && confirmation !== record.nama_satuan)}>{saving ? deleting ? 'Menghapus…' : 'Menyimpan…' : deleting ? 'Hapus Permanen' : 'Simpan'}</button></div>
    </form>
  </Modal>
}

export default function SatuansPage({ search, role }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const canManage = role === 'ADMIN'
  useEffect(() => {
    const controller = new AbortController()
    satuansService.list(controller.signal).then(data => {
      if (!controller.signal.aborted) { setRecords(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [attempt])
  function refresh() { setError(''); setLoading(true); setAttempt(value => value + 1) }
  function open(record = null, deleting = false) { setNotice(''); setDialog({ record, deleting }) }
  const rows = records.filter(record => `${record.kode_satuan} ${record.nama_satuan}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="governance-page">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">MASTER DATA</span><h1>Master Satuan Anggaran</h1><p>{canManage ? 'Kelola kode dan nama satuan anggaran yang tersimpan di database.' : 'Referensi satuan anggaran dari database. Perubahan dikelola oleh Admin.'}</p><span className="integration-pill">Data backend</span></div><div className="work-actions"><Button secondary onClick={refresh} disabled={loading}>Muat ulang</Button>{canManage && <Button icon="plus" onClick={() => open()}>Tambah Satuan</Button>}</div></section>
    {notice && <p className="work-notice" role="status">{notice}</p>}
    <section className="dash-card work-panel" aria-busy={loading}>
      {loading ? <p role="status">Memuat daftar satuan…</p> : error ? <div role="alert"><p>{error}</p><Button secondary onClick={refresh}>Coba lagi</Button></div> : <>
        <p>{rows.length} satuan hasil pencarian</p>
        <Table caption="Daftar satuan anggaran dari database" headers={canManage ? ['Kode Satuan', 'Nama Satuan', 'Tindakan'] : ['Kode Satuan', 'Nama Satuan']}>{rows.map(record => <tr key={record.kode_satuan}><td>{record.kode_satuan}</td><td>{record.nama_satuan}</td>{canManage && <td><div className="work-actions"><Button secondary icon="edit" onClick={() => open(record)}>Ubah</Button><Button secondary onClick={() => open(record, true)}>Hapus</Button></div></td>}</tr>)}</Table>
        {!rows.length && <Empty>{records.length ? 'Tidak ada satuan yang sesuai pencarian.' : 'Belum ada satuan di database.'}</Empty>}
      </>}
    </section>
    {dialog && canManage && <SatuanDialog record={dialog.record} deleting={dialog.deleting} onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message); refresh() }}/ >}
  </div>
}
