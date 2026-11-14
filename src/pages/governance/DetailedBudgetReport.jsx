import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import { Button } from '../../features/governance/Workbench'
import { request } from '../../services/api'
import { printDetailedBudget } from '../../services/detailedBudgetReport'

const crossUnitRoles = ['ADMIN', 'SAKIP', 'SPI', 'KPA']

export default function DetailedBudgetReport({ role, unitName }) {
  const crossUnit = crossUnitRoles.includes(role)
  const [units, setUnits] = useState(null)
  const [unit, setUnit] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!crossUnit) return
    const controller = new AbortController()
    request('/unit-kerjas', { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setUnits(data)
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason.message)
    })
    return () => controller.abort()
  }, [crossUnit])

  async function print() {
    setBusy(true)
    setError('')
    try {
      const query = crossUnit && unit ? '?unit=' + encodeURIComponent(unit) : ''
      const report = await request('/laporan/anggaran-detail' + query)
      if (!report.submissions.some(record => record.items.length)) throw new Error('Belum ada rincian anggaran pada cakupan ini.')
      const scope = !crossUnit || unit ? report.units[0].unit_kerja : 'Seluruh unit kerja'
      printDetailedBudget(report, scope)
    } catch (reason) {
      setError(reason.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="dash-card work-panel detail-report-panel" aria-labelledby="detail-report-title" aria-busy={busy}>
    <div className="detail-report-heading">
      <span className="detail-report-icon" aria-hidden="true"><Icon name="file" /></span>
      <div>
        <h2 id="detail-report-title">Laporan Anggaran Detail</h2>
        <p>Rekap bertingkat dari Program hingga Item Anggaran.</p>
      </div>
    </div>
    <div className="detail-report-controls">
      {crossUnit ? <label className="detail-report-scope">
        <span>Cakupan laporan</span>
        <select value={unit} disabled={!units || busy} onChange={event => setUnit(event.target.value)}>
          <option value="">Seluruh unit kerja</option>
          {units?.map(row => <option key={row.kode_unit_kerja} value={row.kode_unit_kerja}>{row.unit_kerja}</option>)}
        </select>
      </label> : <div className="detail-report-scope">
        <span>Unit kerja</span>
        <strong>{unitName || 'Unit kerja akun Anda'}</strong>
      </div>}
      <div className="detail-report-export">
        <span>Format PDF · A4 landscape</span>
        <Button icon="download" onClick={print} disabled={busy}>{busy ? 'Menyiapkan…' : 'Cetak / Simpan PDF'}</Button>
      </div>
    </div>
    {error && <p className="work-error" role="alert">{error}</p>}
  </section>
}
