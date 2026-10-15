import { INITIAL_PROPOSALS, ROLE_NAMES } from '../dashboard/demoData.js'

export const UNITS = [
  { id: 'TI', name: 'Jurusan Teknik Informatika', type: 'Jurusan', leader: 'Dr. Ir. Hendra Saputra, M.T.', bopts: 1100000000, pnbp: 750000000, active: true },
  { id: 'TM', name: 'Jurusan Teknik Mesin', type: 'Jurusan', leader: 'Dedi Suwandi, S.T., M.Eng.', bopts: 4200000000, pnbp: 2750000000, active: true },
  { id: 'TPTU', name: 'Jurusan Teknik Pendingin & Tata Udara', type: 'Jurusan', leader: 'Ir. Slamet Riyadi, M.T.', bopts: 2900000000, pnbp: 1850000000, active: true },
  { id: 'BUK', name: 'Bagian Umum, Kepegawaian & Keuangan', type: 'Bagian', leader: 'M. Nurul Anwar, S.Pd., M.M.', bopts: 4850000000, pnbp: 2300000000, active: true },
  { id: 'LPPM', name: 'Lembaga Penelitian & Pengabdian Masyarakat', type: 'Lembaga', leader: 'Prof. Dr. Endang Hidayat, M.Si.', bopts: 2200000000, pnbp: 900000000, active: true },
  { id: 'SPM', name: 'Satuan Penjaminan Mutu', type: 'Lembaga', leader: 'Fajar Rohman, S.E., M.Ak.', bopts: 850000000, pnbp: 450000000, active: true },
  { id: 'TIK', name: 'UPA Teknologi Informasi & Komunikasi', type: 'UPA', leader: 'Muhammad Ridwan, S.Kom.', bopts: 1250000000, pnbp: 550000000, active: true },
]
export const ACCOUNTS = [
  { code: '521211', name: 'Belanja Bahan Praktikum', type: 'Operasional', parent: '051.A', active: true },
  { code: '521219', name: 'Belanja Barang Non-Operasional Lainnya', type: 'Non-Operasional', parent: '051.A', active: true },
  { code: '524111', name: 'Belanja Perjalanan Dinas Biasa', type: 'Perjalanan', parent: '051.A', active: true },
  { code: '532111', name: 'Belanja Modal Peralatan & Mesin', type: 'Modal', parent: '051.A', active: true },
  { code: '523121', name: 'Pemeliharaan Peralatan & Mesin', type: 'Pemeliharaan', parent: '052.A', active: true },
  { code: '522191', name: 'Langganan Jasa', type: 'Jasa', parent: '052.A', active: true },
  { code: '521213', name: 'Honor Output Kegiatan', type: 'Honor', parent: '053.A', active: true },
  { code: '521811', name: 'Belanja Barang Persediaan', type: 'Persediaan', parent: '051.A', active: false },
]
export const IKUS = ['Kesiapan kerja lulusan', 'Mahasiswa berkegiatan di luar kampus', 'Dosen berkegiatan di luar kampus', 'Praktisi mengajar di kampus', 'Hasil kerja dosen digunakan masyarakat', 'Kemitraan program studi', 'Kelas kolaboratif dan partisipatif', 'Program studi berstandar internasional'].map((name, i) => ({ code: `IKU ${i + 1}`, name, year: '2027', target: [82.5,45,64,68,74,60,80,50][i], unit: '%', method: 'Rencana dukungan · konfigurasi demo' }))
export const USERS = Object.entries(ROLE_NAMES).map(([role, label], i) => ({ id: `USR-${i + 1}`, name: ['Siti Rahmawati, S.E.', 'Dr. Ir. Hendra Saputra, M.T.', 'Ahmad Fauzi, M.Kom.', 'Bambang Wijayanto, S.E., Ak.', 'Ir. H. Sudirman, M.T.', 'Muhammad Ridwan, S.Kom.'][i], email: `${role.toLowerCase()}@polindra.ac.id`, role, unitId: role === 'ADMIN' ? 'TIK' : 'TI', active: true, label }))
export const ALLOCATIONS = UNITS.flatMap(unit => ['BOPTN', 'PNBP'].map(source => ({ id: `${unit.id}-${source}`, unitId: unit.id, activity: unit.id === 'TI' ? '2144.QMA.002' : `2144.QMA.${unit.id}`, year: '2027', source, amount: source === 'BOPTN' ? unit.bopts : unit.pnbp })))
const executiveNames = ['Modernisasi Server Cloud Lab AI & IoT', 'Mesin CNC Teaching Factory', 'Refrigeran Eco-Friendly & Sertifikasi HVAC', 'Peningkatan Sarana Layanan Kampus', 'Hilirisasi Riset Terapan', 'Audit Mutu dan Akreditasi Program Studi']
export const ALL_PROPOSALS = [...INITIAL_PROPOSALS.map(p => ({ ...p, unitId: 'TI', cycle: 1 })), ...['TI','TM','TPTU','BUK','LPPM','SPM'].map((unitId, i) => ({ id: `USL/2027/${unitId}/K${i + 1}`, unitId, title: executiveNames[i], proposer: UNITS.find(u => u.id === unitId).leader, source: i % 2 ? 'PNBP' : 'BOPTN', amount: [85000000,1250000000,420000000,380000000,200000000,120000000][i], account: i < 2 ? '532111' : '521219', category: i < 2 ? 'Modal' : 'Non-Operasional', status: 'DALAM_PROSES', stage: 'KPA', updated: '15 Okt 2026, 08:30 WIB', cycle: 1 })), { ...INITIAL_PROPOSALS[0], id:'USL/2027/TI/010', amount: 42850000, title:'Pemeliharaan Jaringan Laboratorium dan Router', account:'523121', unitId:'TI', stage:'SAKIP', cycle:1, note:'Lengkapi spesifikasi teknis dan penjelasan dukungan IKU. Catatan contoh dari SPI.' }]
export const unitName = id => UNITS.find(u => u.id === id)?.name || id
export const timeNow = () => new Intl.DateTimeFormat('id-ID', { dateStyle:'medium', timeStyle:'medium', timeZone:'Asia/Jakarta' }).format(new Date()) + ' WIB'
export const isBound = p => p.status === 'DALAM_PROSES' || p.status === 'TERVALIDASI' || (p.status === 'KOREKSI' && p.stage !== 'OPERATOR')
export function allocationUsage(proposals, allocation) {
  const matched = proposals.filter(p => (p.unitId || 'TI') === allocation.unitId && p.source === allocation.source && (p.activity || (p.unitId === 'TI' || !p.unitId ? '2144.QMA.002' : `2144.QMA.${p.unitId}`)) === allocation.activity)
  const validated = matched.filter(p => p.status === 'TERVALIDASI').reduce((n,p) => n+p.amount,0)
  const committed = matched.filter(p => isBound(p) && p.status !== 'TERVALIDASI').reduce((n,p) => n+p.amount,0)
  return { validated, committed, remaining: allocation.amount - validated - committed }
}
export const REPORTS = [
  ['L01','Usul anggaran setiap unit',null], ['L02','Belum disetujui pimpinan unit',['ADMIN','PIMPINAN']], ['L03','Belum diverifikasi Tim SAKIP',['ADMIN','SAKIP']], ['L04','Belum diverifikasi SPI',['ADMIN','SPI']], ['L05','Belum divalidasi KPA',['ADMIN','KPA']], ['L06','Usul bahan praktikum setiap unit',['ADMIN','OPERATOR','PIMPINAN','KPA']], ['L07','Usul belanja aset setiap unit',['ADMIN','OPERATOR','PIMPINAN','KPA']], ['L08','Usul honor setiap unit',['ADMIN','OPERATOR','PIMPINAN','KPA']], ['L09','Usul perjalanan dinas setiap unit',['ADMIN','OPERATOR','PIMPINAN','KPA']], ['L10','Rencana penarikan anggaran setiap unit',['ADMIN','OPERATOR','PIMPINAN','KPA']], ['L11','Rekap subkomponen untuk setiap IKU',null],
]
export function downloadCsv(name, headers, rows) {
  const escape = value => { const s = String(value ?? ''); return `"${(/^[=+@\-\t\r\n]/.test(s) ? "'"+s : s).replaceAll('"','""')}"` }
  const content = [['DATA CONTOH — Bukan dokumen resmi POLINDRA'],headers,...rows].map(row=>row.map(escape).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'}))
  const a = document.createElement('a'); a.href=url; a.download=`${name}-contoh.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}
