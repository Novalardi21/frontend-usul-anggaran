import { useEffect, useRef, useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table } from '../../features/governance/Workbench'
import { request } from '../../services/api'
import { masterCatalogs } from './masterCatalogs'

async function list(path, signal) {
  const records = await request('/' + path, { signal })
  if (!Array.isArray(records)) throw new Error('Format daftar dari backend tidak sesuai.')
  return records
}

function useLoad(load) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ loading: true })
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ data })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ error: error.message })
    })
    return () => controller.abort()
  }, [load, attempt])

  return { ...result, reload() { setResult({ loading: true }); setAttempt(value => value + 1) } }
}

const loaders = Object.fromEntries(masterCatalogs.map(catalog => {
  const sources = [...new Set(catalog.fields?.map(field => field.source).filter(Boolean))]
  return [catalog.path, {
    rows: signal => list(catalog.path, signal),
    options: async signal => Object.fromEntries(await Promise.all(sources.map(async source => [source, await list(source, signal)]))),
  }]
}))

function optionValue(field, row) {
  return field.keys ? JSON.stringify(field.keys.map(key => String(row[key] ?? ''))) : String(row[field.key] ?? '')
}

function CatalogField({ field, record, choices, disabled }) {
  const value = record ? optionValue(field, record) : ''
  const props = { name: field.key, defaultValue: value, required: true, disabled }
  let control
  if (field.source) {
    const options = new Map(choices.map(row => [optionValue(field, row), row]))
    control = <select {...props}>
      <option value="" disabled>{options.size ? 'Pilih ' + field.label : field.label + ' belum tersedia'}</option>
      {value && !options.has(value) && <option value={value}>{field.keys ? JSON.parse(value).join(' / ') : value}</option>}
      {[...options].map(([key, row]) => <option key={key} value={key}>
        {field.keys ? field.keys.map(part => row[part]).join(' / ') : key}{row[field.nameKey] ? ' · ' + row[field.nameKey] : ''}
      </option>)}
    </select>
  } else if (field.long) {
    control = <textarea {...props} rows={4} />
  } else if (field.decimal) {
    control = <input {...props} type="number" min="-999.99" max="999.99" step="0.01" />
  } else {
    control = <input {...props} maxLength={255} readOnly={Boolean(record && field.createOnly)} />
  }
  return <label>{field.label}{control}</label>
}

function CatalogDialog({ catalog, record, onClose, onSaved }) {
  const options = useLoad(loaders[catalog.path].options)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  async function submit(event) {
    event.preventDefault()
    if (submitting.current || !options.data) return
    const form = new FormData(event.currentTarget)
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      const body = {}
      for (const field of catalog.fields) {
        if (record && field.createOnly) continue
        const value = String(form.get(field.key) ?? '').trim()
        if (!value) throw new Error(field.label + ' wajib diisi.')
        if (field.keys) {
          const choice = options.data[field.source].find(row => optionValue(field, row) === value)
          if (!choice && (!record || value !== optionValue(field, record))) throw new Error('Pilih ' + field.label + ' yang tersedia.')
          for (const key of field.keys) body[key] = (choice || record)[key]
        } else {
          body[field.key] = value
        }
      }
      const path = '/' + catalog.path + (record ? '/' + encodeURIComponent(record[catalog.id]) : '')
      await request(path, { method: record ? 'PATCH' : 'POST', body })
      onSaved(catalog.label + (record ? ' berhasil diperbarui.' : ' berhasil ditambahkan.'))
    } catch (reason) {
      setError(reason.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  const missing = options.data && catalog.fields.filter(field => field.source && !options.data[field.source].length && !(record && optionValue(field, record)))
  return <Modal title={(record ? 'Ubah ' : 'Tambah ') + catalog.label} eyebrow="SIPADU · DATA BACKEND" busy={saving} onClose={onClose}>
    {options.loading ? <p role="status">Memuat pilihan…</p> : options.error ? <div role="alert">
      <p>{options.error}</p><Button secondary onClick={options.reload}>Coba lagi</Button>
    </div> : <form className="work-form" onSubmit={submit} aria-busy={saving}>
      {catalog.fields.map(field => <CatalogField key={field.key} field={field} record={record} choices={options.data[field.source]} disabled={saving} />)}
      {missing.length > 0 && <p className="work-error">Tambahkan data {missing.map(field => field.label).join(', ')} terlebih dahulu.</p>}
      {error && <p className="work-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <Button secondary disabled={saving} onClick={onClose}>Batal</Button>
        <button type="submit" className="dash-button" disabled={saving || missing.length > 0}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </form>}
  </Modal>
}

function CatalogTable({ catalog, search }) {
  const result = useLoad(loaders[catalog.path].rows)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const columns = catalog.columns || catalog.fields
  const query = search.trim().toLowerCase()
  const rows = result.data?.filter(row => columns.some(column => String(row[column.key] ?? '').toLowerCase().includes(query)))
  function open(record) { setNotice(''); setDialog({ record }) }

  return <section className="dash-card work-panel" aria-busy={Boolean(result.loading)}>
    <div className="work-section-title">
      <h2>{catalog.label}</h2>
      <div className="work-actions">
        <Button secondary disabled={result.loading} onClick={result.reload}>Muat ulang</Button>
        {!catalog.reference && <Button icon="plus" onClick={() => open(null)}>Tambah Data</Button>}
      </div>
    </div>
    {catalog.reference && <p>Referensi ini ditambahkan melalui {catalog.managedIn}.</p>}
    {notice && <p className="work-notice" role="status">{notice}</p>}
    {result.loading ? <p role="status">Memuat data…</p> : result.error ? <p role="alert">{result.error}</p> :
      rows.length ? <Table caption={catalog.label} headers={[...columns.map(column => column.label), ...(!catalog.reference ? ['Tindakan'] : [])]}>
        {rows.map(row => <tr key={row[catalog.id || columns[0].key]}>
          {columns.map(column => <td key={column.key}>{row[column.key] ?? '—'}</td>)}
          {!catalog.reference && <td><Button secondary icon="edit" onClick={() => open(row)}>Ubah</Button></td>}
        </tr>)}
      </Table> : <Empty>{result.data.length ? 'Tidak ada data yang sesuai pencarian.' : 'Belum ada data.'}</Empty>}
    {dialog && <CatalogDialog catalog={catalog} record={dialog.record} onClose={() => setDialog(null)}
      onSaved={message => { setDialog(null); setNotice(message); result.reload() }} />}
  </section>
}

export default function MasterCatalogPage({ search }) {
  const [selected, setSelected] = useState(masterCatalogs[0].path)
  const catalog = masterCatalogs.find(item => item.path === selected)

  return <div className="governance-page">
    <section className="dash-card work-heading">
      <div><span className="work-eyebrow">MASTER DATA</span><h1>Master Hierarki Anggaran</h1><p>Kelola hierarki dan referensi anggaran dari database.</p></div>
      <div className="work-form">
        <label>Data Master
          <select value={selected} onChange={event => setSelected(event.target.value)}>
            <optgroup label="Data yang dapat dikelola">{masterCatalogs.filter(item => !item.reference).map(item => <option key={item.path} value={item.path}>{item.label}</option>)}</optgroup>
            <optgroup label="Daftar referensi">{masterCatalogs.filter(item => item.reference).map(item => <option key={item.path} value={item.path}>{item.label}</option>)}</optgroup>
          </select>
        </label>
      </div>
    </section>
    <CatalogTable key={selected} catalog={catalog} search={search} />
  </div>
}
