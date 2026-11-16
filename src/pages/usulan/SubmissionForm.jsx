import { useEffect, useRef, useState } from 'react'
import { Button } from '../../features/governance/Workbench'
import { pengajuansService, prepareSubmission, submissionTotal, canRepairSubmission, revisionBudget, revisionItems, submissionCodeFields, submissionItemValues, submissionFunding } from '../../services/pengajuans'
import { formatPagu, paguAmount } from '../../services/pagus'
import SubmissionReferences from './SubmissionReferences'
import './submission-form.css'

const blankItem = () => ({ key: crypto.randomUUID(), ...submissionItemValues() })

function ReferenceSelect({ field, label, name, rows, value, onChange, disabled }) {
  const choices = new Map(rows.map(row => [String(row[field]), row[name]]))
  return <label>{label} *
    <select value={value} required disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="">{choices.size ? 'Pilih ' + label : label + ' belum tersedia'}</option>
      {value && !choices.has(value) && <option value={value} disabled>{value} (tidak tersedia)</option>}
      {[...choices].map(([code, description]) => <option key={code} value={code}>{code} · {description}</option>)}
    </select>
  </label>
}

export default function SubmissionForm({ user, revisionId = null }) {
  const [options, setOptions] = useState({ pagus: [], accounts: [], satuans: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [items, setItems] = useState(() => [blankItem()])
  const [error, setError] = useState('')
  const [referenceItem, setReferenceItem] = useState(null)
  const [review, setReview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [original, setOriginal] = useState(null)
  const submitting = useRef(false)
  useEffect(() => {
    if (user.role !== 'OPERATOR') return
    const controller = new AbortController()
    Promise.all([pengajuansService.options(controller.signal), revisionId ? pengajuansService.detail(revisionId, controller.signal) : null]).then(([data, record]) => {
      data.pagus.forEach(record => paguAmount(record.nominal_pagu))
      if (record && (!canRepairSubmission(record, user.role) || String(record.kode_unit_kerja) !== String(user.unitId))) throw new Error('Pengajuan bukan revisi pada tahap Operator unit Anda.')
      if (!controller.signal.aborted) {
        setOptions(data); setOriginal(record)
        if (record) {
          const restored = revisionItems(record).map(item => ({ ...item, key: crypto.randomUUID() }))
          setItems(restored.length ? restored : [blankItem()])
        }
        setLoading(false)
      }
    }).catch(reason => {
      if (!controller.signal.aborted) { setLoadError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [attempt, user.role, user.unitId, revisionId])
  function reload() { setLoadError(''); setLoading(true); setAttempt(value => value + 1) }
  const total = submissionTotal(items)
  const funding = submissionFunding(items)
  const source = original && original.pagu_id == null && !original.jenis_pagu ? '' : funding.source
  const balances = options.pagus.filter(record => record.jenis_pagu === source)
  const correction = revisionBudget(original, options, source)
  const balance = original ? correction.available : balances.length === 1 ? paguAmount(balances[0].nominal_pagu) : null
  const over = total !== null && balance !== null && total > balance
  const legacyChanged = correction?.legacy && total !== null && total !== correction.available
  const locked = saving || Boolean(review)
  function update(key, field, value) {
    setError('')
    const changes = { [field]: value }
    if (field === 'kode_iku') {
      const indicator = options.indicators.find(row => String(row.kode_iku) === value)
      changes.target_iku = String(indicator?.target_iku ?? '')
    }
    setItems(previous => previous.map(item => item.key === key ? { ...item, ...changes } : item))
  }
  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    setError('')
    try {
      const payload = prepareSubmission({ items }, options, original)
      if (!review) { setReview(payload); return }
      submitting.current = true
      setSaving(true)
      const data = original ? await pengajuansService.resubmit(original.pengajuan_id, payload) : await pengajuansService.submit(payload)
      setResult(data)
      setReview(null)
    } catch (reason) { setError(reason.message); setReview(null) }
    finally { submitting.current = false; setSaving(false) }
  }
  if (user.role !== 'OPERATOR') return <p role="alert">Formulir pengajuan tersedia untuk Operator Unit.</p>
  if (result) return <section className="dash-card work-panel submission-success"><h1>Pengajuan Berhasil Dikirim</h1><p role="status">{result.msg}</p>{(result.nomor_pengajuan || original?.nomor_pengajuan) && <p>Nomor pengajuan: <strong>{result.nomor_pengajuan || original.nomor_pengajuan}</strong></p>}<p>Total pengajuan: <strong>{formatPagu(result.total_nominal_diajukan)}</strong></p>{result.sisa_pagu === null ? <p>Total revisi tetap; saldo pagu tidak diubah.</p> : <p>Sisa pagu: <strong>{formatPagu(result.sisa_pagu)}</strong></p>}<a className="dash-button" href={`#/usulan-anggaran?pengajuan=${encodeURIComponent(result.pengajuan_id)}`}>Lihat Pengajuan</a></section>
  return <div className="governance-page live-submission-form">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">USULAN ANGGARAN</span><h1>{revisionId ? 'Perbaiki Pengajuan' : 'Formulir Pengajuan'}</h1><p>{user.unitName || `Unit ${user.unitId}`} · {revisionId ? 'Perbaiki rincian lalu ajukan ulang ke Pimpinan Unit. Saldo disesuaikan berdasarkan selisih nominal.' : 'Pengajuan dikirim ke Pimpinan Unit dan langsung mengurangi saldo pagu sesuai kode kegiatan.'}</p><span className="integration-pill">Data backend</span></div><Button secondary disabled={saving || Boolean(review)} onClick={reload}>Muat Ulang Referensi</Button></section>
    {loading ? <section className="dash-card work-panel" role="status">Memuat pagu dan referensi anggaran…</section> : loadError ? <section className="dash-card work-panel" role="alert"><p>{loadError}</p><Button secondary onClick={reload}>Coba lagi</Button></section> : <form onSubmit={submit} className="submission-create" aria-busy={saving}>
      {original?.catatan_revisi && <section className="dash-card work-panel submission-note"><h2>Catatan yang Harus Diperbaiki</h2><p>{original.catatan_revisi}</p></section>}
      <section className="dash-card work-panel submission-create-header">
        <label>Nomor Pengajuan<input value={original?.nomor_pengajuan || 'Dibuat otomatis saat dikirim'} readOnly /></label>
        <label>Jenis Pagu<input value={source || (correction?.legacy ? 'Sumber asal belum tercatat' : 'Mengikuti kode kegiatan')} readOnly /></label>
        <div className="submission-balance"><span>{correction?.legacy ? 'Total yang harus dipertahankan' : correction?.moved ? 'Batas total dari saldo sumber dana tujuan' : original ? 'Batas total revisi (saldo tersedia + nominal lama)' : 'Sisa pagu tersedia'}</span><strong>{balance === null ? !source && !original ? 'Isi kode kegiatan' : 'Pagu tidak tersedia' : formatPagu(balance)}</strong></div>
        {correction?.moved && source && <p className="submission-confirmation">Saat diajukan ulang, {formatPagu(original.total_nominal_pengajuan)} dikembalikan ke {correction.originalSource}. Total revisi akan diambil dari {source}.</p>}
        {correction?.legacy && <p className="work-error">Sumber pagu pengajuan lama belum tercatat. Rincian dapat diperbaiki, tetapi total harus tetap {formatPagu(original.total_nominal_pengajuan)}. Hubungi Admin jika total perlu berubah.</p>}
        {!original && !options.pagus.length && <p className="work-error">Unit Anda belum memiliki alokasi pagu. Hubungi Admin.</p>}
      </section>
      {!options.accounts.length && <p className="work-error">Belum ada akun anggaran. Hubungi Admin untuk melengkapi data akun.</p>}
      {!options.satuans.length && <p className="work-error">Belum ada satuan anggaran. Hubungi Admin untuk melengkapi satuan.</p>}
      {items.map((item, index) => {
        const amount = submissionTotal([item])
        return <section key={item.key} className="dash-card work-panel submission-create-item"><div className="work-actions"><h2>Rincian {index + 1}</h2><Button secondary disabled={locked || items.length === 1} onClick={() => setItems(previous => previous.filter(row => row.key !== item.key))}>Hapus Rincian</Button></div>
          <div className="submission-reference-guide">
            <p>Mulai dari jalur <strong>Program → Kegiatan → Output → SO → Komponen</strong>. Kegiatan menentukan jenis pagu. Pilih SK dan Akun sesuai item, lalu pilih IKU untuk mengisi target otomatis.</p>
            <Button secondary disabled={locked} onClick={() => setReferenceItem(item.key)}>Lihat Referensi Kode</Button>
          </div>
          <label>Nama Item *<input value={item.nama_item} maxLength={255} required disabled={locked} onChange={event => update(item.key, 'nama_item', event.target.value)} /></label>
          <div className="submission-item-fields submission-code-fields">
            {submissionCodeFields.map(([key, label, source, name]) => <ReferenceSelect key={key} field={key} label={label} name={name} rows={options[source]} value={item[key]} disabled={locked} onChange={value => update(item.key, key, value)} />)}
            <label>Target IKU *<input type="number" min="0" max="999.99" step="0.01" value={item.target_iku} required disabled={locked}
              placeholder={options.indicators.find(row => row.kode_iku === item.kode_iku)?.target_iku}
              onChange={event => update(item.key, 'target_iku', event.target.value)} /></label>
            <ReferenceSelect field="kode_jenis_belanja" label="Jenis Belanja" name="jenis_belanja" rows={options.spendingTypes} value={item.kode_jenis_belanja} disabled={locked} onChange={value => update(item.key, 'kode_jenis_belanja', value)} />
          </div>
          <div className="submission-item-fields"><label>Volume *<input inputMode="numeric" pattern="[0-9]+" required value={item.volume} maxLength={10} onChange={event => update(item.key, 'volume', event.target.value)} disabled={locked}/></label><label>Satuan *<select value={item.kode_satuan} onChange={event => update(item.key, 'kode_satuan', event.target.value)} required disabled={locked}><option value="">Pilih satuan</option>{options.satuans.map(record => <option key={record.kode_satuan} value={record.kode_satuan}>{record.nama_satuan} ({record.kode_satuan})</option>)}</select></label><label>Harga Satuan (Rp) *<input inputMode="numeric" pattern="[0-9]+" required value={item.nominal_satuan} maxLength={19} onChange={event => update(item.key, 'nominal_satuan', event.target.value)} disabled={locked}/></label><div className="submission-item-total"><span>Total Rincian</span><strong>{amount === null ? '—' : formatPagu(amount)}</strong></div></div>
        </section>
      })}
      <Button secondary disabled={locked} icon="plus" onClick={() => setItems(previous => [...previous, blankItem()])}>Tambah Rincian</Button>
      <section className="dash-card work-panel submission-create-summary"><h2>Ringkasan Pengajuan</h2><p>Total: <strong>{total === null ? 'Lengkapi volume dan harga yang valid' : formatPagu(total)}</strong></p><p>{correction?.legacy ? 'Penyesuaian saldo' : 'Sisa setelah diajukan'}: <strong>{correction?.legacy ? 'Tidak berubah jika total tetap' : balance !== null && total !== null ? formatPagu(balance - total) : '—'}</strong></p>
        {funding.error && <p className="work-error" role="alert">{funding.error}</p>}
        {over && <p className="work-error" role="alert">Total melebihi saldo pagu {source}. Kurangi volume atau harga rincian.</p>}
        {legacyChanged && <p className="work-error" role="alert">Total revisi harus tetap sama dengan nominal pengajuan lama.</p>}
        {review && <p className="submission-confirmation">{original ? 'Ajukan ulang' : 'Kirim'} <strong>{original?.nomor_pengajuan || 'pengajuan ini'}</strong> senilai <strong>{formatPagu(total)}</strong>{source ? ` dari ${source}` : ''}? {correction?.moved ? `Nominal lama dikembalikan ke ${correction.originalSource} dan total revisi dikurangi dari ${source}. Berkas kembali ke Pimpinan Unit.` : original ? 'Saldo hanya disesuaikan dengan selisih nominal. Nomor pengajuan tetap dan berkas kembali ke Pimpinan Unit.' : 'Saldo pagu akan langsung dikurangi dan pengajuan diteruskan ke Pimpinan Unit.'}</p>}
        {error && <p className="work-error" role="alert">{error}</p>}
        <div className="work-actions">{review && <Button secondary disabled={saving} onClick={() => setReview(null)}>Kembali Mengubah</Button>}<button className="dash-button" type="submit" disabled={saving || !funding.source || over || legacyChanged || balance === null || total === null || total <= 0n || !options.accounts.length || !options.satuans.length}>{saving ? 'Mengirim…' : review ? original ? 'Ajukan Ulang ke Pimpinan Unit' : 'Kirim ke Pimpinan Unit' : 'Tinjau Pengajuan'}</button></div>
      </section>
    </form>}
    {referenceItem && <SubmissionReferences options={options} onClose={() => setReferenceItem(null)} onPick={fields => {
      setItems(previous => previous.map(item => item.key === referenceItem ? { ...item, ...fields } : item))
      setError('')
      setReferenceItem(null)
    }} />}
  </div>
}
