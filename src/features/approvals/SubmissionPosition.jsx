import Icon from '../../components/ui/Icon'
import { submissionStages, submissionStatuses } from '../../services/pengajuans'
import './submission-position.css'

const forward = ['operator', 'pimpinan_unit', 'tim_sakip', 'spi', 'kpa', 'completed']
const returning = ['kpa', 'spi', 'tim_sakip', 'pimpinan_unit', 'operator']
const tasks = {
  operator: 'Operator memperbaiki rincian, lalu mengajukan ulang ke Pimpinan Unit.',
  pimpinan_unit: 'Berkas berada pada Pimpinan Unit untuk ditinjau dan ditindaklanjuti.',
  tim_sakip: 'Berkas berada pada Tim SAKIP untuk verifikasi dan tindak lanjut.',
  spi: 'Berkas berada pada SPI untuk pemeriksaan dan tindak lanjut.',
  kpa: 'Berkas berada pada KPA untuk pemeriksaan dan keputusan akhir.',
  completed: 'Proses pengajuan telah selesai.',
}

export default function SubmissionPosition({ record }) {
  const revision = record.status === 'revision'
  const stages = revision ? returning : forward
  const current = submissionStages[record.current_position] || record.current_position || 'Belum diketahui'
  return <section className={`submission-position${revision ? ' is-returning' : ''}${record.status === 'approved' ? ' is-approved' : ''}`} aria-label={`Posisi berkas ${record.nomor_pengajuan}: ${current}`}>
    <div className="submission-position-heading"><div><span className="work-eyebrow">{revision ? 'JALUR PENGEMBALIAN BERKAS' : 'ALUR PENGAJUAN ANGGARAN'}</span><h3>Posisi Berkas</h3></div><span className="submission-position-current"><Icon name={revision ? 'swap' : 'clock'}/>{current} · {submissionStatuses[record.status] || record.status}</span></div>
    <ol className="submission-position-steps">{stages.map((stage, index) => {
      const active = record.current_position === stage
      return <li key={stage} className={active ? 'is-active' : ''} aria-current={active ? 'step' : undefined}>
        <div className="submission-position-node"><span className="submission-position-number">{active ? <Icon name={record.status === 'approved' ? 'check' : revision ? 'edit' : 'file'}/> : index + 1}</span><div><strong>{submissionStages[stage]}</strong><small>{active ? 'Berkas ada di sini' : revision ? 'Jalur koreksi' : 'Tahap pengajuan'}</small></div></div>
        {index < stages.length - 1 && <Icon name="arrow" className="submission-position-arrow"/>}
      </li>
    })}</ol>
    <p className="submission-position-task"><Icon name="info"/>{tasks[record.current_position] || 'Posisi berkas belum dikenali.'}</p>
  </section>
}
