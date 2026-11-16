import { useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { Button, Empty, Table, Tabs } from '../../features/governance/Workbench'

const views = [['hierarchy', 'Jalur Program'], ['sk', 'Subkomponen (SK)'], ['accounts', 'Akun Anggaran']]
const hierarchyFields = ['kode_program', 'kode_kegiatan', 'kode_output', 'kode_so', 'kode_komponen']
const describe = (row, code, name) => row ? [row[code], row[name]].filter(Boolean).join(' · ') : '—'

function hierarchyRows({ programs, activities, outputs, suboutputs, components }) {
  return components.flatMap(component => {
    const activity = activities.find(row => row.kode_kegiatan === component.kode_kegiatan)
    const program = programs.find(row => row.kode_program === activity?.kode_program)
    const output = outputs.find(row => row.kode_output === component.kode_output)
    const suboutput = suboutputs.find(row => row.kode_so === component.kode_so
      && row.kode_output === component.kode_output && row.kode_kegiatan === component.kode_kegiatan)
    if (!program || !output || !suboutput) return []
    return [{
      key: component.id,
      fields: { ...Object.fromEntries(hierarchyFields.slice(1).map(field => [field, String(component[field])])), kode_program: String(program.kode_program) },
      cells: [
        describe(program, 'kode_program', 'nama_program'),
        describe(activity, 'kode_kegiatan', 'nama_kegiatan'),
        describe(output, 'kode_output', 'nama_output'),
        describe(suboutput, 'kode_so', 'nama_suboutput'),
        describe(component, 'kode_komponen', 'nama_komponen'),
      ],
    }]
  })
}

export default function SubmissionReferences({ options, onClose, onPick }) {
  const [view, setView] = useState('hierarchy')
  const [search, setSearch] = useState('')
  const hierarchy = view === 'hierarchy'
  const headers = hierarchy ? ['Program', 'Kegiatan', 'Output', 'SO', 'Komponen']
    : view === 'sk' ? ['Kode SK', 'Nama Subkomponen'] : ['Kode Akun', 'Nama Akun']
  const records = hierarchy ? hierarchyRows(options) : view === 'sk'
    ? options.subcomponents.map(row => ({ key: row.id, cells: [row.kode_sk, row.nama_subkomponen], fields: { kode_sk: String(row.kode_sk) } }))
    : options.accounts.map(row => ({ key: row.kode_akun, cells: [row.kode_akun, row.nama_akun], fields: { kode_akun: String(row.kode_akun) } }))
  const query = search.trim().toLowerCase()
  const rows = records.filter(row => row.cells.join(' ').toLowerCase().includes(query))

  return <Modal title="Referensi Kode Anggaran" eyebrow="FORMULIR PENGAJUAN" className="submission-references" onClose={onClose}>
    <div className="work-form">
      <p>Program menaungi Kegiatan. Pilih Output, SO, dan Komponen dari baris jalur yang sama. Kode SK dan Kode Akun dipilih sesuai kebutuhan item dari daftar masing-masing.</p>
      <Tabs items={views} value={view} onChange={next => { setView(next); setSearch('') }} label="Jenis referensi kode" />
      <label>Cari kode atau nama<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <Table caption={headers.join(', ')} headers={[...headers, 'Tindakan']}>
        {rows.map(row => <tr key={row.key}>
          {row.cells.map((cell, index) => <td key={headers[index]}>{cell}</td>)}
          <td><Button secondary onClick={() => onPick(row.fields)}>{hierarchy ? 'Pakai Jalur' : 'Pakai Kode'}</Button></td>
        </tr>)}
      </Table>
      {!rows.length && <Empty>{records.length ? 'Tidak ada kode yang cocok dengan pencarian.' : 'Data referensi belum tersedia.'}</Empty>}
    </div>
  </Modal>
}
