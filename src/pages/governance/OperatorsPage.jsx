import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'
import { request } from '../../services/api'
import { unitsService } from '../../services/units'

const roleLabels = {
  operator: 'Operator', pimpinan_unit: 'Pimpinan Unit', tim_sakip: 'Tim SAKIP',
  spi: 'SPI', kpa: 'KPA', superadmin: 'Superadmin',
}

const operatorPath = id => '/operators/' + encodeURIComponent(id)
const unitName = (record, units) => record.unit_kerja?.unit_kerja
  || units.find(unit => String(unit.kode_unit_kerja) === String(record.kode_unit_kerja))?.unit_kerja || '—'

function AccountPasswordField({ label, name, required, disabled, minLength }) {
  const [visible, setVisible] = useState(false)
  return <div className="account-password-field">
    <label htmlFor={name}>{label}</label>
    <div className="account-password-control">
      <input id={name} name={name} type={visible ? 'text' : 'password'} autoComplete="new-password"
        required={required} disabled={disabled} minLength={minLength} />
      <button type="button" className="dash-icon-button" aria-controls={name}
        aria-label={(visible ? 'Sembunyikan ' : 'Tampilkan ') + label.toLowerCase()}
        onClick={() => setVisible(value => !value)} disabled={disabled}>
        <Icon name={visible ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  </div>
}

function OperatorDialog({ record, removing, units, self, onClose, onSaved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const submitting = useRef(false)
  const [role, setRole] = useState(record?.role || 'operator')
  const needsUnit = ['operator', 'pimpinan_unit'].includes(role)
  const title = removing ? 'Hapus Akun' : record ? 'Ubah Akun' : 'Tambah Akun'

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
        if (!email || !name) throw new Error('Isi nama dan email akun.')
        if (needsUnit && !unit) throw new Error('Pilih unit kerja yang terdaftar.')
        if ((!record || values.password) && values.password.length < 8) throw new Error('Kata sandi minimal 8 karakter.')
        if (values.password !== values.confPassword) throw new Error('Konfirmasi kata sandi harus sama.')
        await request(record ? operatorPath(record.id) : '/operators', {
          method: record ? 'PATCH' : 'POST',
          body: {
            email, nama_operator: name, role, kode_unit_kerja: unit?.kode_unit_kerja ?? null,
            ...(values.password ? { password: values.password, confPassword: values.confPassword } : {}),
          },
        })
      }
      onSaved(removing ? 'Akun berhasil dihapus.' : record ? 'Akun berhasil diperbarui.' : 'Akun berhasil ditambahkan.')
    } catch (reason) {
      setError(reason.message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <Modal title={title} eyebrow="SIPADU · DATA AKUN" busy={busy} onClose={onClose}>
    <form className="work-form" onSubmit={submit} aria-busy={busy}>
      {removing ? <>
        <p className="work-notice warning">Akun <strong>{record.email}</strong> akan dihapus permanen. Akun yang masih memiliki pengajuan tidak bisa dihapus.</p>
        <label>Ketik email akun untuk konfirmasi<input value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={busy} /></label>
      </> : <>
        <label>Nama Pengguna<input name="nama_operator" defaultValue={record?.nama_operator} maxLength={255} required disabled={busy} /></label>
        <label>Email<input name="email" type="email" defaultValue={record?.email} maxLength={255} required disabled={busy} /></label>
        <label>Peran<select value={role} onChange={event => setRole(event.target.value)} disabled={busy || self}>
          {!Object.hasOwn(roleLabels, role) && <option value={role} disabled>{role}</option>}
          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label>Unit Kerja{needsUnit && ' *'}<select name="kode_unit_kerja" defaultValue={record?.kode_unit_kerja ?? ''} required={needsUnit} disabled={busy}>
          <option value="">{needsUnit ? 'Pilih unit kerja' : 'Tanpa unit kerja'}</option>
          {units.map(unit => <option key={unit.kode_unit_kerja} value={unit.kode_unit_kerja}>{unit.kode_unit ? unit.kode_unit + ' · ' : ''}{unit.unit_kerja}</option>)}
        </select></label>
        <AccountPasswordField label={record ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'} name="password"
          required={!record} disabled={busy} minLength={8} />
        <AccountPasswordField label="Konfirmasi Kata Sandi" name="confPassword" required={!record} disabled={busy} />
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

export default function OperatorsPage({ search, userId }) {
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([request('/operators', { signal }), unitsService.list(signal)]).then(([records, units]) => {
      if (!Array.isArray(records)) throw new Error('Format daftar akun tidak sesuai.')
      if (!signal.aborted) setState({ records, units })
    }).catch(reason => {
      if (!signal.aborted) setState({ error: reason.message })
    })
    return () => controller.abort()
  }, [attempt])

  function reload() { setState({ loading: true }); setAttempt(value => value + 1) }
  function open(record = null, removing = false) { setNotice(''); setDialog({ record, removing }) }

  const [roleFilter, setRoleFilter] = useState('')

  const query = search.trim().toLowerCase()
  const rows = state.records?.filter(record => (!roleFilter || record.role === roleFilter) && [record.nama_operator, record.email, roleLabels[record.role], unitName(record, state.units)]
    .join(' ').toLowerCase().includes(query))

  return <div className="governance-page">
    <section className="dash-card work-heading">
      <div><span className="work-eyebrow">PENGELOLAAN AKUN</span><h1>Data Akun</h1><p>Kelola akun, peran, dan unit kerja.</p></div>
      <div className="work-actions">
        <Button secondary onClick={reload} disabled={state.loading}>Muat ulang</Button>
        <Button icon="plus" onClick={() => open()} disabled={!state.records}>Tambah Akun</Button>
      </div>
    </section>
    {notice && <p className="work-notice" role="status">{notice}</p>}
    <section className="dash-card work-panel" aria-busy={Boolean(state.loading)}>
      {state.loading ? <p role="status">Memuat daftar akun…</p> : state.error ? <p role="alert">{state.error}</p> : <>
        <div className="work-filters accounts-filter">
          <label>Peran<select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}>
            <option value="">Semua peran</option>
            {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
        </div>
        <Table caption="Daftar akun" headers={['Nama Pengguna', 'Email', 'Peran', 'Unit Kerja', 'Tindakan']}>
          {rows.map(record => <tr key={record.id}>
            <td>{record.nama_operator}</td><td>{record.email}</td><td>{roleLabels[record.role] || record.role}</td><td>{unitName(record, state.units)}</td>
            <td><div className="work-actions">
              <Button secondary icon="edit" onClick={() => open(record)}>Ubah</Button>
              {String(record.id) !== String(userId) && <Button secondary onClick={() => open(record, true)}>Hapus</Button>}
            </div></td>
          </tr>)}
        </Table>
        {!rows.length && <Empty>Tidak ada akun yang sesuai.</Empty>}
      </>}
    </section>
    {dialog && <OperatorDialog record={dialog.record} removing={dialog.removing} units={state.units} self={String(dialog.record?.id) === String(userId)}
      onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message); reload() }} />}
  </div>
}
