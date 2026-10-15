import { getReviewSnapshot } from '../approvals/reviewData.js'
import { getBudgetSummary } from './demoData.js'

export function getRoleProfile(role) {
  if (role === 'PIMPINAN') return { name:'Dr. Ir. Hendra Saputra, M.T.', shortName:'Dr. Ir. Hendra', initials:'HS', title:'Ketua Jurusan TI', scope:'Jurusan Teknik Informatika' }
  if (role === 'SAKIP') return { name:'Ahmad Fauzi, M.Kom.', shortName:'Ahmad Fauzi', initials:'AF', title:'Tim Verifikator SAKIP & Perencanaan', scope:'Lintas unit POLINDRA' }
  return { name:'Siti Rahmawati, S.E.', shortName:'Siti Rahmawati', initials:'SR', title:null, scope:'Jurusan Teknik Informatika' }
}

// Initial fixtures do not contain final IKU assessments. These links are only
// illustrative planning mappings; saved submission snapshots take precedence.
export function performanceLinks(proposal) {
  const saved = getReviewSnapshot(proposal).items.filter(item => item.iku)
  if (saved.length) return [...new Set(saved.map(item => item.iku))].map(code => ({ code, illustrative:false }))
  const title = proposal.title.toLowerCase()
  const codes = /kurikulum|workshop/.test(title) ? ['IKU 6','IKU 7'] : /sertifikasi|bnsp/.test(title) ? ['IKU 1','IKU 2'] : /riset|repositori/.test(title) ? ['IKU 5'] : ['IKU 7','IKU 8']
  return codes.map(code => ({ code, illustrative:true }))
}

export function selectRoleDashboard({proposals,allocations,units,ikus,role,year,unitId='ALL',source='ALL',iku='ALL',search=''}) {
  const unitScoped=role==='PIMPINAN'
  const records=year==='2027'?proposals.filter(p=>(!unitScoped||(p.unitId||'TI')==='TI')&&(unitScoped||unitId==='ALL'||p.unitId===unitId)):[]
  const funds=allocations.filter(a=>a.year===year&&(!unitScoped||a.unitId==='TI')&&(unitScoped||unitId==='ALL'||a.unitId===unitId))
  const total=funds.reduce((n,a)=>n+a.amount,0)
  const {validated,committed}=getBudgetSummary(records)
  const pending=records.filter(p=>p.status==='DALAM_PROSES'&&p.stage===role)
  const corrections=records.filter(p=>p.status==='KOREKSI')
  const myCorrections=corrections.filter(p=>p.stage===role)
  const passed=records.filter(p=>p.status==='TERVALIDASI'||(p.status==='DALAM_PROSES'&&(role==='SAKIP'?['SPI','KPA'].includes(p.stage):['SAKIP','SPI','KPA'].includes(p.stage))))
  const queue=pending.filter(p=>(source==='ALL'||p.source===source)&&(iku==='ALL'||performanceLinks(p).some(link=>link.code===iku))&&`${p.id} ${p.title} ${p.account} ${p.proposer} ${units.find(u=>u.id===p.unitId)?.name||''}`.toLowerCase().includes(search.toLowerCase()))
  const distribution=units.map(unit=>({ ...unit, count:pending.filter(p=>p.unitId===unit.id).length, amount:pending.filter(p=>p.unitId===unit.id).reduce((n,p)=>n+p.amount,0) })).filter(unit=>unit.count)
  const indicators=ikus.filter(i=>i.year===year).map(i=>({ ...i, amount:records.reduce((n,p)=>{const links=performanceLinks(p);return n+(links.some(link=>link.code===i.code)?p.amount/links.length:0)},0) }))
  return {records,total,validated,committed,remaining:total-validated-committed,pending,corrections,myCorrections,passed,queue,distribution,indicators}
}

export function splitSubunitAllocation(total) {
  const labels=['Prodi Sarjana Terapan Rekayasa Perangkat Lunak','Program Studi D3 Teknik Informatika','Lab Cloud Computing, AI & Cybersecurity','Lab Hardware, IoT & Jaringan Komputer']
  const weights=[38,30.2,19.4,12.4]
  let allocated=0
  return labels.map((name,index)=>{const amount=index===3?total-allocated:Math.floor(total*weights[index]/100);allocated+=amount;return {name,amount,percent:weights[index]}})
}
