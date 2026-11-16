import { useEffect, useState } from 'react'
import { Button } from '../../features/governance/Workbench'
import { request } from '../../services/api'
import { submissionStages } from '../../services/pengajuans'
import AuditPage from './AuditPage'

const roleCodes = {
  superadmin: 'ADMIN', operator: 'OPERATOR', pimpinan_unit: 'PIMPINAN',
  tim_sakip: 'SAKIP', spi: 'SPI', kpa: 'KPA',
}

const wibDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', dateStyle: 'short' })
const wibTime = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })

export default function LiveAuditPage({ search }) {
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    request('/audit-logs', { signal: controller.signal }).then(data => {
      if (!Array.isArray(data)) throw new Error('Format daftar audit tidak sesuai.')
      const events = data.map(entry => {
        const date = new Date(entry.createdAt)
        return {
          ...entry, iso: date.toISOString(), day: wibDate.format(date), time: wibTime.format(date) + ' WIB',
          role: roleCodes[entry.role] || entry.role,
          before: submissionStages[entry.before] || entry.before,
          after: submissionStages[entry.after] || entry.after,
        }
      })
      if (!controller.signal.aborted) setState({ events })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ error: error.message })
    })
    return () => controller.abort()
  }, [attempt])

  function reload() {
    setState({ loading: true })
    setAttempt(value => value + 1)
  }

  if (state.loading || state.error) return <section className="dash-card work-panel">
    <h1>Audit Aktivitas</h1>
    {state.loading ? <p role="status">Memuat audit aktivitas…</p> : <div role="alert"><p>{state.error}</p><Button secondary onClick={reload}>Coba lagi</Button></div>}
  </section>

  return <AuditPage events={state.events} search={search} live onReload={reload} />
}
