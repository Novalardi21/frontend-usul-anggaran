import { useEffect, useRef, useState } from 'react'
import { masterAkunsService } from '../../services/masterAkuns'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'

function MasterAkunDialog({ record, deleting = false, onSaved, onClose }) {
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
        if (confirmation !== record.nama_akun) throw new Error('Nama konfirmasi harus sama persis dengan nama akun anggaran.')
        await masterAkunsService.remove(record.kode_akun)
      } else await masterAkunsService.save(values, record?.kode_akun)
      onSaved(deleting ? 'Akun Anggaran berhasil dihapus.' : record ? 'Nama akun anggaran berhasil diperbarui.' : 'Akun Anggaran berhasil ditambahkan.')
    } catch (reason) {
      setError(reason.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }
  return <Modal title={deleting ? 'Hapus Akun Anggaran' : record ? 'Ubah Akun Anggaran' : 'Tambah Akun Anggaran'} eyebrow="SIPADU · DATA BACKEND" busy={saving} onClose={onClose}>
    <form className="work-form" onSubmit={submit} aria-busy={saving} onChange={() => setError('')}>
      {deleting ? <div className="work-notice warning"><p><strong>Peringatan: penghapusan permanen.</strong> Akun Anggaran <strong>{record.nama_akun}</strong> ({record.kode_akun}) akan dihapus dari database dan tidak dapat dipulihkan melalui aplikasi. Akun Anggaran yang masih dipakai hierarki akun atau rincian anggaran akan ditolak. Ketik nama akun anggaran persis untuk melanjutkan.</p></div> : <p>{record ? 'Kode akun anggaran tetap sama agar rincian anggaran yang menggunakannya tetap terhubung.' : 'Masukkan kode dan nama akun anggaran, misalnya kode 521211 dengan nama Belanja Bahan.'}</p>}
      {deleting ? <label>Ketik Nama Akun Anggaran *<input value={confirmation} onChange={event => setConfirmation(event.target.value)} required maxLength={255} disabled={saving}/></label> : <>
      <label>Kode Akun Anggaran *<input name="kode_akun" defaultValue={record?.kode_akun || ''} required maxLength={record ? 255 : 6} inputMode="numeric" readOnly={Boolean(record)} disabled={saving}/></label>
      <label>Nama Akun Anggaran *<input name="nama_akun" defaultValue={record?.nama_akun || ''} required maxLength={255} disabled={saving}/></label>
      </>}
      {error && <p className="work-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button secondary onClick={onClose} disabled={saving}>Batal</Button><button className="dash-button" type="submit" disabled={saving || (deleting && confirmation !== record.nama_akun)}>{saving ? deleting ? 'Menghapus…' : 'Menyimpan…' : deleting ? 'Hapus Permanen' : 'Simpan'}</button></div>
    </form>
  </Modal>
}

export default function MasterAkunsPage({ search, role }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const canManage = role === 'ADMIN'
  useEffect(() => {
    const controller = new AbortController()
    masterAkunsService.list(controller.signal).then(data => {
      if (!controller.signal.aborted) { setRecords(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [attempt])
  function refresh() { setError(''); setLoading(true); setAttempt(value => value + 1) }
  function open(record = null, deleting = false) { setNotice(''); setDialog({ record, deleting }) }
  const rows = records.filter(record => `${record.kode_akun} ${record.nama_akun}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="governance-page">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">MASTER DATA</span><h1>Master Akun Anggaran</h1><p>{canManage ? 'Kelola kode dan nama akun anggaran yang tersimpan di database.' : 'Referensi akun anggaran dari database. Perubahan dikelola oleh Admin.'}</p><span className="integration-pill">Data backend</span></div><div className="work-actions"><Button secondary onClick={refresh} disabled={loading}>Muat ulang</Button>{canManage && <Button icon="plus" onClick={() => open()}>Tambah Akun Anggaran</Button>}</div></section>
    {notice && <p className="work-notice" role="status">{notice}</p>}
    <section className="dash-card work-panel" aria-busy={loading}>
      {loading ? <p role="status">Memuat daftar akun anggaran…</p> : error ? <div role="alert"><p>{error}</p><Button secondary onClick={refresh}>Coba lagi</Button></div> : <>
        <p>{rows.length} akun anggaran hasil pencarian</p>
        <Table caption="Daftar akun anggaran dari database" headers={canManage ? ['Kode Akun Anggaran', 'Nama Akun Anggaran', 'Tindakan'] : ['Kode Akun Anggaran', 'Nama Akun Anggaran']}>{rows.map(record => <tr key={record.kode_akun}><td>{record.kode_akun}</td><td>{record.nama_akun}</td>{canManage && <td><div className="work-actions"><Button secondary icon="edit" onClick={() => open(record)}>Ubah</Button><Button secondary onClick={() => open(record, true)}>Hapus</Button></div></td>}</tr>)}</Table>
        {!rows.length && <Empty>{records.length ? 'Tidak ada akun anggaran yang sesuai pencarian.' : 'Belum ada akun anggaran di database.'}</Empty>}
      </>}
    </section>
    {dialog && canManage && <MasterAkunDialog record={dialog.record} deleting={dialog.deleting} onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message); refresh() }}/ >}
  </div>
}
