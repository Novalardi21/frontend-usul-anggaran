const field = (key, label, options = {}) => ({ key, label, ...options })
const code = (key, label, createOnly = false) => field(key, label, { createOnly })

const programCode = code('kode_program', 'Kode Program', true)
const programName = field('nama_program', 'Nama Program')
const activityCode = code('kode_kegiatan', 'Kode Kegiatan', true)
const activityName = field('nama_kegiatan', 'Nama Kegiatan')
const outputCode = code('kode_output', 'Kode Output')
const suboutputCode = code('kode_so', 'Kode Suboutput')
const componentCode = code('kode_komponen', 'Kode Komponen')
const subcomponentCode = code('kode_sk', 'Kode Subkomponen')
const activity = field('kode_kegiatan', 'Kegiatan', { source: 'kegiatans', nameKey: 'nama_kegiatan' })
const output = field('kode_output', 'Output', { source: 'master-outputs' })

export const masterCatalogs = [
  {
    path: 'programs', label: 'Program', id: 'kode_program',
    fields: [programCode, programName],
  },
  {
    path: 'kegiatans', label: 'Kegiatan', id: 'kode_kegiatan',
    fields: [activityCode, activityName, field('kode_program', 'Program', { source: 'programs', nameKey: 'nama_program' })],
  },
  {
    path: 'outputs', label: 'Output', id: 'id',
    fields: [outputCode, field('nama_output', 'Nama Output')],
  },
  {
    path: 'suboutputs', label: 'Suboutput', id: 'id',
    fields: [suboutputCode, field('nama_suboutput', 'Nama Suboutput'), output, activity],
  },
  {
    path: 'komponens', label: 'Komponen', id: 'id',
    fields: [componentCode, field('nama_komponen', 'Nama Komponen'),
      field('suboutput', 'Suboutput', { source: 'suboutputs', nameKey: 'nama_suboutput', keys: ['kode_so', 'kode_output', 'kode_kegiatan'] })],
    columns: [componentCode, field('nama_komponen', 'Nama Komponen'), suboutputCode, output, activity],
  },
  {
    path: 'subkomponens', label: 'Subkomponen', id: 'id',
    fields: [subcomponentCode, field('nama_subkomponen', 'Nama Subkomponen')],
  },
  {
    path: 'jenis-belanjas', label: 'Jenis Belanja', id: 'kode_jenis_belanja',
    fields: [field('jenis_belanja', 'Jenis Belanja')],
    columns: [code('kode_jenis_belanja', 'Kode'), field('jenis_belanja', 'Jenis Belanja')],
  },
  {
    path: 'ikus', label: 'Indikator Kinerja Utama (IKU)', id: 'kode_iku',
    fields: [code('kode_iku', 'Kode IKU', true), field('nama_iku', 'Nama IKU', { long: true }), field('target_iku', 'Target IKU', { decimal: true })],
  },
  { path: 'master-outputs', label: 'Referensi Kode Output', columns: [outputCode], reference: true, managedIn: 'Output' },
  { path: 'master-suboutputs', label: 'Referensi Kode Suboutput', columns: [suboutputCode], reference: true, managedIn: 'Suboutput' },
  { path: 'master-komponens', label: 'Referensi Kode Komponen', columns: [componentCode], reference: true, managedIn: 'Komponen' },
  { path: 'master-subkomponens', label: 'Referensi Kode Subkomponen', columns: [subcomponentCode], reference: true, managedIn: 'Subkomponen' },
  { path: 'master-pagus', label: 'Referensi Sumber Dana Pagu', columns: [field('jenis_pagu', 'Sumber Dana')], reference: true, managedIn: 'Daftar Pagu' },
]
