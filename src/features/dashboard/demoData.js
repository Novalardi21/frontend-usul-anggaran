// All records in this module are illustrative, not production data.
export const DEMO_UNIT = 'Jurusan Teknik Informatika'
export const STATUS = {
  DRAF: { label: 'Draf', tone: 'neutral', icon: 'file' },
  DALAM_PROSES: { label: 'Dalam proses', tone: 'info', icon: 'clock' },
  KOREKSI: { label: 'Perlu koreksi', tone: 'warning', icon: 'alert' },
  TERVALIDASI: { label: 'Tervalidasi', tone: 'success', icon: 'check' },
}
export const STAGES = { OPERATOR: 'Operator', PIMPINAN: 'Pimpinan', SAKIP: 'SAKIP', SPI: 'SPI', KPA: 'KPA / Direktur' }
export const ROLE_NAMES = { OPERATOR: 'Operator', PIMPINAN: 'Pimpinan Unit', SAKIP: 'Tim SAKIP', SPI: 'Auditor SPI', KPA: 'KPA / Direktur', ADMIN: 'Administrator' }
export const FUNDING = [
  { code: 'BOPTN', name: 'Bantuan Operasional PTN', ceiling: 1100000000 },
  { code: 'PNBP', name: 'Penerimaan Negara Bukan Pajak', ceiling: 750000000 },
]
export const INITIAL_PROPOSALS = [
  { id: 'USL/2027/TI/005', title: 'Pengadaan Lisensi Tool Praktikum Cloud Computing', account: '521211', category: 'Bahan', proposer: 'Lab Komputer Jaringan & TI', source: 'PNBP', amount: 64000000, status: 'KOREKSI', stage: 'OPERATOR', updated: '15 Okt 2026, 09:15 WIB', note: 'Lengkapi rincian lisensi dan sesuaikan harga satuan dengan dokumen pendukung.' },
  { id: 'USL/2027/TI/004', title: 'Peremajaan Server Hyperconverged Smart Lab TI', account: '532111', category: 'Peralatan', proposer: 'Dr. Ir. Hendra Saputra, M.T.', source: 'BOPTN', amount: 485000000, status: 'DALAM_PROSES', stage: 'SPI', updated: '14 Okt 2026, 16:40 WIB' },
  { id: 'USL/2027/TI/003', title: 'Pelaksanaan Uji Sertifikasi BNSP Junior Web & Cyber Security', account: '524111', category: 'Perjalanan', proposer: 'Panitia Sertifikasi Kompetensi Mahasiswa', source: 'PNBP', amount: 145000000, status: 'DALAM_PROSES', stage: 'SAKIP', updated: '14 Okt 2026, 11:20 WIB' },
  { id: 'USL/2027/TI/002', title: 'Penyelenggaraan Expo Riset Terapan & Vokasi Mahasiswa', account: '521219', category: 'Non-Operasional', proposer: 'Koordinator Kemahasiswaan TI', source: 'BOPTN', amount: 240000000, status: 'TERVALIDASI', stage: null, updated: '12 Okt 2026, 15:10 WIB' },
  { id: 'USL/2027/TI/001', title: 'Langganan Repositori Riset Digital & Akses IEEE Xplore', account: '522191', category: 'Langganan Jasa', proposer: 'Unit Penelitian & Pengabdian TI', source: 'PNBP', amount: 100000000, status: 'TERVALIDASI', stage: null, updated: '08 Okt 2026, 14:00 WIB' },
  { id: 'USL/2027/TI/006', title: 'Workshop Pengembangan Kurikulum Berbasis Industri', account: '521219', category: 'Non-Operasional', proposer: 'Tim Kurikulum TI', source: 'BOPTN', amount: 40000000, status: 'DALAM_PROSES', stage: 'PIMPINAN', updated: '07 Okt 2026, 10:30 WIB' },
  { id: 'USL/2027/TI/007', title: 'Pengadaan Perangkat Praktikum Internet of Things', account: '532111', category: 'Peralatan', proposer: 'Laboratorium Sistem Cerdas', source: 'PNBP', amount: 219550000, status: 'DALAM_PROSES', stage: 'SAKIP', updated: '06 Okt 2026, 13:00 WIB' },
  { id: 'USL/2027/TI/008', title: 'Pengembangan Modul Pembelajaran Pemrograman', account: '521211', category: 'Bahan', proposer: 'Tim Pengajar TI', source: 'BOPTN', amount: 40000000, status: 'DRAF', stage: 'OPERATOR', updated: '05 Okt 2026, 09:00 WIB' },
  { id: 'USL/2027/TI/009', title: 'Pemeliharaan Jaringan Laboratorium Komputer', account: '523121', category: 'Pemeliharaan', proposer: 'Laboratorium Komputer', source: 'PNBP', amount: 32800000, status: 'DRAF', stage: 'OPERATOR', updated: '04 Okt 2026, 08:30 WIB' },
]

export function getBudgetSummary(proposals) {
  const validated = proposals.filter(item => item.status === 'TERVALIDASI').reduce((sum, item) => sum + item.amount, 0)
  const committed = proposals.filter(item => item.status === 'DALAM_PROSES' || (item.status === 'KOREKSI' && item.stage !== 'OPERATOR')).reduce((sum, item) => sum + item.amount, 0)
  return { validated, committed }
}
