import { useEffect, useRef, useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'
import { request } from '../../services/api'
import { unitsService } from '../../services/units'

const operatorPath = id => '/operators/' + encodeURIComponent(id)
const unitName = (record, units) => record.unit_kerja?.unit_kerja
  || units.find(unit => String(unit.kode_unit_kerja) === String(record.kode_unit_kerja))?.unit_kerja || '—'

function OperatorDialog({ record, removing, units, onClose, onSaved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const submitting = useRef(false)
  const title = removing ? 'Hapus Operator' : record ? 'Ubah Operator' : 'Tambah Operator'

  async function submit(event) {
    event.preventDefault()
    if (submitting.current || (removing && confirmation !== record.email)) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    submitting.current = true
    try {
      if (removing) {
        await request(operatorPath(record.id), { method: 'DELETE' })
      } else {
        const email = values.email.trim()
        const name = values.nama_operator.trim()
        const unit = units.find(row => String(row.kode_unit_kerja) === values.kode_unit_kerja)
        if (!email || !name || !unit) throw new Error('Isi nama, email, dan unit kerja yang terdaftar.')
        if ((!record || values.password) && values.password.length < 8) throw new Error('Kata sandi minimal 8 karakter.')
        if (values.password !== values.confPassword) throw new Error('Konfirmasi kata sandi harus sama.')
        await request(record ? operatorPath(record.id) : '/operators', {
          method: record ? 'PATCH' : 'POST',
          body: {
            email, nama_operator: name, role: 'operator', kode_unit_kerja: unit.kode_unit_kerja,
            ...(values.password ? { password: values.password, confPassword: values.confPassword } : {}),
          },
        })
      }
      onSaved(removing ? 'Operator berhasil dihapus.' : record ? 'Operator berhasil diperbarui.' : 'Operator berhasil ditambahkan.')
    } catch (reason) {
      setError(reason.message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <Modal title={title} eyebrow="SIPADU · DATA OPERATOR" busy={busy} onClose={onClose}>
    <form className="work-form" onSubmit={submit} aria-busy={busy}>
      {removing ? <>
        <p className="work-notice warning">Akun <strong>{record.email}</strong> akan dihapus permanen. Akun yang masih memiliki pengajuan tidak bisa dihapus.</p>
        <label>Ketik email operator untuk konfirmasi<input value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={busy} /></label>
      </> : <>
        <label>Nama Operator<input name="nama_operator" defaultValue={record?.nama_operator} maxLength={255} required disabled={busy} /></label>
        <label>Email<input name="email" type="email" defaultValue={record?.email} maxLength={255} required disabled={busy} /></label>
        <label>Unit Kerja<select name="kode_unit_kerja" defaultValue={record?.kode_unit_kerja ?? ''} required disabled={busy}>
          <option value="">Pilih unit kerja</option>
          {units.map(unit => <option key={unit.kode_unit_kerja} value={unit.kode_unit_kerja}>{unit.unit_kerja}</option>)}
        </select></label>
        <label>{record ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'}<input name="password" type="password" minLength={8}
          autoComplete="new-password" required={!record} disabled={busy} /></label>
        <label>Konfirmasi Kata Sandi<input name="confPassword" type="password" autoComplete="new-password" required={!record} disabled={busy} /></label>
      </>}
      {error && <p className="work-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <Button secondary onClick={onClose} disabled={busy}>Batal</Button>
        <button type="submit" className="dash-button" disabled={busy || (removing && confirmation !== record.email)}>
          {busy ? 'Memproses…' : removing ? 'Hapus Permanen' : 'Simpan'}
        </button>
      </div>
    </form>
  </Modal>
}

export default function OperatorsPage({ search }) {
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([request('/operators', { signal }), unitsService.list(signal)]).then(([records, units]) => {
      if (!Array.isArray(records)) throw new Error('Format daftar operator tidak sesuai.')
      if (!signal.aborted) setState({ records: records.filter(record => record.role === 'operator'), units })
    }).catch(reason => {
      if (!signal.aborted) setState({ error: reason.message })
    })
    return () => controller.abort()
  }, [attempt])

  function reload() { setState({ loading: true }); setAttempt(value => value + 1) }
  function open(record = null, removing = false) { setNotice(''); setDialog({ record, removing }) }

  const query = search.trim().toLowerCase()
  const rows = state.records?.filter(record => [record.nama_operator, record.email, unitName(record, state.units)]
    .join(' ').toLowerCase().includes(query))

  return <div className="governance-page">
    <section className="dash-card work-heading">
      <div><span className="work-eyebrow">PENGELOLAAN AKUN</span><h1>Data Operator</h1><p>Kelola akun operator dan unit kerjanya.</p></div>
      <div className="work-actions">
        <Button secondary onClick={reload} disabled={state.loading}>Muat ulang</Button>
        <Button icon="plus" onClick={() => open()} disabled={!state.units?.length}>Tambah Operator</Button>
      </div>
    </section>
    {notice && <p className="work-notice" role="status">{notice}</p>}
    {state.units?.length === 0 && <p className="work-notice">Tambahkan unit kerja sebelum membuat akun operator.</p>}
    <section className="dash-card work-panel" aria-busy={Boolean(state.loading)}>
      {state.loading ? <p role="status">Memuat daftar operator…</p> : state.error ? <p role="alert">{state.error}</p> : <>
        <Table caption="Daftar operator unit" headers={['Nama Operator', 'Email', 'Unit Kerja', 'Tindakan']}>
          {rows.map(record => <tr key={record.id}>
            <td>{record.nama_operator}</td><td>{record.email}</td><td>{unitName(record, state.units)}</td>
            <td><div className="work-actions">
              <Button secondary icon="edit" onClick={() => open(record)}>Ubah</Button>
              <Button secondary onClick={() => open(record, true)}>Hapus</Button>
            </div></td>
          </tr>)}
        </Table>
        {!rows.length && <Empty>Belum ada operator yang sesuai.</Empty>}
      </>}
    </section>
    {dialog && <OperatorDialog record={dialog.record} removing={dialog.removing} units={state.units}
      onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message); reload() }} />}
  </div>
}
