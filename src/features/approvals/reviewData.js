import { STAGES } from '../dashboard/demoData.js'

export const REVIEW_STAGES = ['OPERATOR', 'PIMPINAN', 'SAKIP', 'SPI', 'KPA']
export const REVIEW_ROLES = ['PIMPINAN', 'SAKIP', 'SPI', 'KPA']
export const reviewAction = role => role === 'KPA' ? 'Validasi' : role === 'PIMPINAN' ? 'Setujui' : 'Verifikasi'
export const canReview = (proposal, role) => proposal.status === 'DALAM_PROSES' && proposal.stage === role && REVIEW_ROLES.includes(role)

export function getReviewSnapshot(proposal) {
  if (proposal.reviewSnapshot) return proposal.reviewSnapshot
  const amounts = [Math.floor(proposal.amount * .6), Math.floor(proposal.amount * .2), Math.floor(proposal.amount * .12)]
  amounts.push(proposal.amount - amounts.reduce((sum, amount) => sum + amount, 0))
  const serverItems = [
    { account: '532111', name: 'Server komputasi untuk Smart Lab TI', description: 'Perangkat komputasi dan kelengkapan instalasi laboratorium.', volume: 2, unit: 'Unit', price: 160000000 },
    { account: '532111', name: 'Perangkat penyimpanan dan pencadangan', description: 'Media penyimpanan terpusat untuk kegiatan praktikum.', volume: 1, unit: 'Paket', price: 96000000 },
    { account: '523121', name: 'Pemeliharaan dan konfigurasi sistem', description: 'Penyiapan layanan, konfigurasi jaringan, dan pemeliharaan.', volume: 1, unit: 'Paket', price: 45000000 },
    { account: '532111', name: 'Perangkat jaringan pendukung laboratorium', description: 'Kelengkapan konektivitas untuk laboratorium komputasi.', volume: 1, unit: 'Paket', price: 24000000 },
  ]
  const genericNames = ['Kebutuhan utama kegiatan', 'Bahan dan perangkat pendukung', 'Dukungan pelaksanaan kegiatan', 'Dokumentasi dan kelengkapan kegiatan']
  const items = proposal.id === 'USL/2027/TI/004' && proposal.amount === 485000000 ? serverItems : amounts.map((amount, index) => ({ account: proposal.account, name: genericNames[index], description: `Rincian contoh untuk ${proposal.title.toLowerCase()}.`, volume: 1, unit: 'Paket', price: amount }))
  return { title: proposal.title, amount: proposal.amount, source: proposal.source, cycle: proposal.cycle || 1, items: items.map((item, index) => ({ ...item, id: index + 1, total: item.volume * item.price })), justification: 'Rencana kegiatan mendukung peningkatan mutu pembelajaran, kesiapan sarana praktikum, dan pengembangan kompetensi mahasiswa Teknik Informatika. Kebutuhan ini ditampilkan sebagai contoh untuk meninjau keterkaitan rencana anggaran dengan kinerja akademik.' }
}

export function getReviewHistory(proposal) {
  if (proposal.reviewHistory) return proposal.reviewHistory
  if (proposal.status === 'KOREKSI') {
    const cycle=proposal.cycle||1
    const history=[{stage:'OPERATOR',action:'AJUKAN',actor:'Operator (contoh)',note:'Usulan contoh diajukan untuk pemeriksaan.',time:'10 Okt 2026, 09:30 WIB',cycle},{stage:'SPI',action:'KEMBALIKAN',actor:'Auditor SPI (contoh)',note:proposal.note||'Rincian memerlukan perbaikan.',time:'14 Okt 2026, 09:30 WIB',cycle}]
    for (const stage of ['SAKIP','PIMPINAN']) {
      if (REVIEW_STAGES.indexOf(stage) > REVIEW_STAGES.indexOf(proposal.stage)) history.push({stage,action:'TERUSKAN_KOREKSI',actor:`${STAGES[stage]} (contoh)`,note:'Catatan diteruskan satu tahap ke belakang tanpa mengubah rincian.',time:'14 Okt 2026, 14:00 WIB',cycle})
    }
    return history
  }
  const activeIndex = REVIEW_STAGES.indexOf(proposal.stage)
  const completed = proposal.status === 'TERVALIDASI' ? REVIEW_STAGES : REVIEW_STAGES.slice(0, Math.max(0, activeIndex))
  return completed.map((stage, index) => ({ stage, action: stage === 'OPERATOR' ? 'AJUKAN' : stage === 'PIMPINAN' ? 'SETUJUI' : stage === 'KPA' ? 'VALIDASI' : 'VERIFIKASI', actor: `${STAGES[stage]} (contoh)`, note: stage === 'SAKIP' ? 'Rencana dukungan IKU telah ditinjau. Lanjutkan pemeriksaan kepatuhan administratif dan rincian biaya.' : stage === 'PIMPINAN' ? 'Kebutuhan kegiatan telah ditinjau di tingkat unit. Dilanjutkan ke tahap berikutnya.' : 'Usulan diajukan untuk pemeriksaan berjenjang.', time: `${10 + index} Okt 2026, 09:30 WIB`, cycle: 1 }))
}

export function getMonthlyPlan(items) {
  return items.map(item => {
    if (item.months) return { itemId:item.id, amounts:[...item.months] }
    const march = Math.floor(item.total * .4)
    const june = Math.floor(item.total * .3)
    return { itemId: item.id, amounts: [0, 0, march, 0, 0, june, 0, 0, item.total - march - june, 0, 0, 0] }
  })
}

export function decideReview(proposal, role, decision, note, actor = 'Siti Rahmawati (demo)') {
  if (!canReview(proposal, role)) throw new Error('Keputusan hanya dapat diambil oleh pemeriksa pada tahap aktif.')
  if (!['approve', 'return'].includes(decision)) throw new Error('Keputusan tidak dikenal.')
  if (decision === 'return' && !note.trim()) throw new Error('Catatan pengembalian wajib diisi.')
  const index = REVIEW_STAGES.indexOf(role)
  const nextStage = decision === 'return' ? REVIEW_STAGES[index - 1] : REVIEW_STAGES[index + 1] || null
  const status = decision === 'return' ? 'KOREKSI' : nextStage ? 'DALAM_PROSES' : 'TERVALIDASI'
  const time = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date()) + ' WIB'
  return { ...proposal, stage: nextStage, status, updated: time, ...(decision === 'return' ? { note: note.trim() } : {}), reviewSnapshot: getReviewSnapshot(proposal), reviewHistory: [...getReviewHistory(proposal), { stage: role, action: decision === 'return' ? 'KEMBALIKAN' : role === 'KPA' ? 'VALIDASI' : role === 'PIMPINAN' ? 'SETUJUI' : 'VERIFIKASI', actor, note: note.trim() || 'Rincian usulan telah ditinjau pada simulasi pemeriksaan.', time, cycle: proposal.cycle || 1 }] }
}

