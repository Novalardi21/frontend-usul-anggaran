import { useEffect, useRef, useState } from 'react'
import { Button } from '../../features/governance/Workbench'
import { pengajuansService, prepareSubmission, submissionTotal, canRepairSubmission, revisionBudget, revisionItems } from '../../services/pengajuans'
import { formatPagu, paguAmount } from '../../services/pagus'
import './submission-form.css'

const blankItem = () => ({ key: crypto.randomUUID(), akun_id: '', kode_satuan: '', volume: '', nominal_satuan: '' })

export default function SubmissionForm({ user, revisionId = null }) {
  const [options, setOptions] = useState({ pagus: [], accounts: [], satuans: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [number, setNumber] = useState('')
  const [source, setSource] = useState('')
  const [items, setItems] = useState(() => [blankItem()])
  const [error, setError] = useState('')
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
          setNumber(record.nomor_pengajuan)
          setSource(revisionBudget(record, data).source)
          const restored = revisionItems(record, data.accounts).map(item => ({ ...item, key: crypto.randomUUID() }))
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
  const balances = options.pagus.filter(record => record.jenis_pagu === source)
  const correction = revisionBudget(original, options, source)
  const balance = original ? correction.available : balances.length === 1 ? paguAmount(balances[0].nominal_pagu) : null
  const over = total !== null && balance !== null && total > balance
  const legacyChanged = correction?.legacy && total !== null && total !== correction.available
  const locked = saving || Boolean(review)
  function update(key, field, value) { setError(''); setItems(previous => previous.map(item => item.key === key ? { ...item, [field]: value } : item)) }
  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    setError('')
    try {
      const payload = prepareSubmission({ nomor_pengajuan: number, jenis_pagu: source, items }, options, original)
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
  if (result) return <section className="dash-card work-panel submission-success"><h1>Pengajuan Berhasil Dikirim</h1><p role="status">{result.msg}</p><p>Total pengajuan: <strong>{formatPagu(result.total_nominal_diajukan)}</strong></p>{result.sisa_pagu === null ? <p>Total revisi tetap; saldo pagu tidak diubah.</p> : <p>Sisa pagu: <strong>{formatPagu(result.sisa_pagu)}</strong></p>}<a className="dash-button" href={`#/usulan-anggaran?pengajuan=${encodeURIComponent(result.pengajuan_id)}`}>Lihat Pengajuan</a></section>
  return <div className="governance-page live-submission-form">
    <section className="dash-card work-heading"><div><span className="work-eyebrow">USULAN ANGGARAN</span><h1>{revisionId ? 'Perbaiki Pengajuan' : 'Formulir Pengajuan'}</h1><p>{user.unitName || `Unit ${user.unitId}`} · {revisionId ? 'Perbaiki rincian lalu ajukan ulang ke Pimpinan Unit. Saldo disesuaikan berdasarkan selisih nominal.' : 'Pengajuan dikirim ke Pimpinan Unit dan langsung mengurangi saldo pagu sumber dana yang dipilih.'}</p><span className="integration-pill">Data backend</span></div><Button secondary disabled={saving || Boolean(review)} onClick={reload}>Muat Ulang Referensi</Button></section>
    {loading ? <section className="dash-card work-panel" role="status">Memuat pagu, akun hierarki, dan satuan…</section> : loadError ? <section className="dash-card work-panel" role="alert"><p>{loadError}</p><Button secondary onClick={reload}>Coba lagi</Button></section> : <form onSubmit={submit} className="submission-create" aria-busy={saving}>
      {original?.catatan_revisi && <section className="dash-card work-panel submission-note"><h2>Catatan yang Harus Diperbaiki</h2><p>{original.catatan_revisi}</p></section>}
      <section className="dash-card work-panel submission-create-header">
        <label>Nomor Pengajuan *<input value={number} onChange={event => { setNumber(event.target.value); setError('') }} required maxLength={255} disabled={locked} readOnly={Boolean(original)} placeholder="Nomor unik untuk unit Anda"/></label>
        <label>Sumber Dana *<select value={source} onChange={event => { setSource(event.target.value); setError('') }} required disabled={locked || Boolean(correction?.legacy)}><option value="">{correction?.legacy ? 'Sumber pengajuan lama belum tercatat' : 'Pilih sumber dana'}</option>{[...new Set(options.pagus.map(record => record.jenis_pagu))].map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <div className="submission-balance"><span>{correction?.legacy ? 'Total yang harus dipertahankan' : correction?.moved ? 'Batas total dari saldo sumber dana tujuan' : original ? 'Batas total revisi (saldo tersedia + nominal lama)' : 'Sisa pagu tersedia'}</span><strong>{balance === null ? !source && !original ? 'Pilih sumber dana' : 'Pagu tidak tersedia' : formatPagu(balance)}</strong></div>
        {correction?.moved && source && <p className="submission-confirmation">Saat diajukan ulang, {formatPagu(original.total_nominal_pengajuan)} dikembalikan ke {correction.originalSource}. Total revisi akan diambil dari {source}.</p>}
        {correction?.legacy && <p className="work-error">Sumber pagu pengajuan lama belum tercatat. Rincian dapat diperbaiki, tetapi total harus tetap {formatPagu(original.total_nominal_pengajuan)}. Hubungi Admin jika total perlu berubah.</p>}
        {!original && !options.pagus.length && <p className="work-error">Unit Anda belum memiliki alokasi pagu. Hubungi Admin.</p>}
      </section>
      {!options.accounts.length && <p className="work-error">Belum ada akun pada hierarki anggaran. Hubungi Admin untuk melengkapi data akun.</p>}
      {!options.satuans.length && <p className="work-error">Belum ada satuan anggaran. Hubungi Admin untuk melengkapi satuan.</p>}
      {items.map((item, index) => {
        const account = options.accounts.find(record => String(record.id) === item.akun_id)
        const amount = submissionTotal([item])
        return <section key={item.key} className="dash-card work-panel submission-create-item"><div className="work-actions"><h2>Rincian {index + 1}</h2><Button secondary disabled={locked || items.length === 1} onClick={() => setItems(previous => previous.filter(row => row.key !== item.key))}>Hapus Rincian</Button></div>
          <label>Akun / Hierarki Anggaran *<select value={item.akun_id} onChange={event => update(item.key, 'akun_id', event.target.value)} required disabled={locked}><option value="">Pilih akun hierarki</option>{options.accounts.map(record => <option key={record.id} value={record.id}>{record.kode_akun} · {record.master_akun?.nama_akun || 'Akun anggaran'} · {record.kode_program}/{record.kode_kegiatan}/{record.kode_output}/{record.kode_so}/{record.kode_komponen}/{record.kode_sk}</option>)}</select></label>
          {account && <p className="submission-hierarchy">Program {account.kode_program} → Kegiatan {account.kode_kegiatan} → Output {account.kode_output} → Suboutput {account.kode_so} → Komponen {account.kode_komponen} → Subkomponen {account.kode_sk} → Akun {account.kode_akun}</p>}
          <div className="submission-item-fields"><label>Volume *<input inputMode="numeric" pattern="[0-9]+" required value={item.volume} maxLength={10} onChange={event => update(item.key, 'volume', event.target.value)} disabled={locked}/></label><label>Satuan *<select value={item.kode_satuan} onChange={event => update(item.key, 'kode_satuan', event.target.value)} required disabled={locked}><option value="">Pilih satuan</option>{options.satuans.map(record => <option key={record.kode_satuan} value={record.kode_satuan}>{record.nama_satuan} ({record.kode_satuan})</option>)}</select></label><label>Harga Satuan (Rp) *<input inputMode="numeric" pattern="[0-9]+" required value={item.nominal_satuan} maxLength={19} onChange={event => update(item.key, 'nominal_satuan', event.target.value)} disabled={locked}/></label><div className="submission-item-total"><span>Total Rincian</span><strong>{amount === null ? '—' : formatPagu(amount)}</strong></div></div>
        </section>
      })}
      <Button secondary disabled={locked} icon="plus" onClick={() => setItems(previous => [...previous, blankItem()])}>Tambah Rincian</Button>
      <section className="dash-card work-panel submission-create-summary"><h2>Ringkasan Pengajuan</h2><p>Total: <strong>{total === null ? 'Lengkapi volume dan harga yang valid' : formatPagu(total)}</strong></p><p>{correction?.legacy ? 'Penyesuaian saldo' : 'Sisa setelah diajukan'}: <strong>{correction?.legacy ? 'Tidak berubah jika total tetap' : balance !== null && total !== null ? formatPagu(balance - total) : '—'}</strong></p>
        {over && <p className="work-error" role="alert">Total melebihi saldo pagu {source}. Kurangi volume atau harga rincian.</p>}
        {legacyChanged && <p className="work-error" role="alert">Total revisi harus tetap sama dengan nominal pengajuan lama.</p>}
        {review && <p className="submission-confirmation">{original ? 'Ajukan ulang' : 'Kirim'} <strong>{number}</strong> senilai <strong>{formatPagu(total)}</strong>{source ? ` dari ${source}` : ''}? {correction?.moved ? `Nominal lama dikembalikan ke ${correction.originalSource} dan total revisi dikurangi dari ${source}. Berkas kembali ke Pimpinan Unit.` : original ? 'Saldo hanya disesuaikan dengan selisih nominal. Nomor pengajuan tetap dan berkas kembali ke Pimpinan Unit.' : 'Saldo pagu akan langsung dikurangi dan pengajuan diteruskan ke Pimpinan Unit.'}</p>}
        {error && <p className="work-error" role="alert">{error}</p>}
        <div className="work-actions">{review && <Button secondary disabled={saving} onClick={() => setReview(null)}>Kembali Mengubah</Button>}<button className="dash-button" type="submit" disabled={saving || over || legacyChanged || balance === null || total === null || total <= 0n || !options.accounts.length || !options.satuans.length}>{saving ? 'Mengirim…' : review ? original ? 'Ajukan Ulang ke Pimpinan Unit' : 'Kirim ke Pimpinan Unit' : 'Tinjau Pengajuan'}</button></div>
      </section>
    </form>}
  </div>
}
