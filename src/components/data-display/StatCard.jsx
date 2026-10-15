import Icon from '../ui/Icon'
import { formatNumber, formatPercent } from '../../utils/format'

export default function StatCard({ label, value, icon, tone = 'primary', helper, percent, caption }) {
  return <article className={`dash-card stat-card tone-${tone}`}>
    <div className="stat-top"><h2>{label}</h2><span className="stat-icon"><Icon name={icon} /></span></div>
    <p className="stat-value"><span>Rp</span> {formatNumber(value)}</p>
    <div className="stat-helper"><span>{helper}</span><span className="stat-percent">{formatPercent(percent)} {caption}</span></div>
    <div className="meter" role="meter" aria-label={`${label} terhadap total pagu`} aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div>
  </article>
}
