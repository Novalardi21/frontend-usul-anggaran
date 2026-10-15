import Icon from '../ui/Icon'
import { STATUS, STAGES } from '../../features/dashboard/demoData'

export default function StatusBadge({ status, stage }) {
  const config = STATUS[status]
  return <span className={`status-badge tone-${config.tone}`}><Icon name={config.icon} />{config.label}{stage && status !== 'DRAF' ? ` · ${STAGES[stage]}` : ''}</span>
}
