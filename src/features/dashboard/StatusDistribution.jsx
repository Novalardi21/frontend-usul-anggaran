import Icon from '../../components/ui/Icon'
import { STATUS } from './demoData'
import { formatMoney, formatPercent } from '../../utils/format'

const order = ['TERVALIDASI', 'DALAM_PROSES', 'KOREKSI', 'DRAF']
export default function StatusDistribution({ proposals, year, onFilter }) {
  return <section className="dash-card distribution-card" aria-labelledby="distribution-title"><div className="analytics-heading"><div><h2 id="distribution-title">Distribusi Status Usulan</h2><p>Total {proposals.length} berkas usulan anggaran</p></div><span className="small-year">TI TA {year}</span></div>
    <div className="distribution-list">{order.map(status => {
      const config = STATUS[status]
      const items = proposals.filter(item => item.status === status)
      const percent = proposals.length ? items.length / proposals.length * 100 : 0
      return <button key={status} className={`distribution-row tone-${config.tone}`} onClick={() => onFilter(status)}><span className="distribution-label"><span><Icon name={config.icon} />{config.label}{status === 'TERVALIDASI' && ' (KPA / Direktur)'}</span><strong>{items.length} Usulan</strong></span><span className="meter"><span style={{ width: `${percent}%` }} /></span><span className="distribution-meta"><span>{formatMoney(items.reduce((sum, item) => sum + item.amount, 0))}{status === 'DRAF' && ' (estimasi)'}</span><span>{formatPercent(percent)} total berkas</span></span></button>
    })}</div>
    <button className="queue-button" onClick={() => onFilter('DALAM_PROSES')}><Icon name="review" />Buka Antrean Pemeriksaan ({proposals.filter(item => item.status === 'DALAM_PROSES').length} Berkas)<Icon name="arrow" /></button>
  </section>
}
