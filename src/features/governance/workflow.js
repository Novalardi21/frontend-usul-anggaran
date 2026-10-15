import { getReviewSnapshot, getReviewHistory, getMonthlyPlan, REVIEW_STAGES } from '../approvals/reviewData.js'
import { allocationUsage, timeNow, IKUS } from './demo.js'

export function forwardCorrection(proposal, role, note='') {
  if(proposal.status!=='KOREKSI'||proposal.stage!==role||!['PIMPINAN','SAKIP','SPI'].includes(role))throw new Error('Anda hanya dapat meneruskan koreksi pada tahap aktif Anda.')
  const nextStage=REVIEW_STAGES[REVIEW_STAGES.indexOf(role)-1]
  return {...proposal,stage:nextStage,updated:timeNow(),reviewSnapshot:getReviewSnapshot(proposal),reviewHistory:[...getReviewHistory(proposal),{stage:role,action:'TERUSKAN_KOREKSI',actor:`${role} (demo)`,note:note.trim()||'Catatan pemeriksa diteruskan satu tahap ke belakang tanpa mengubah rincian.',time:timeNow(),cycle:proposal.cycle||1}]}
}
export function saveProposalForm(proposal,values,submit,role,proposals,allocations,accounts,ikus=IKUS) {
  if(role!=='OPERATOR'||(proposal&&!['DRAF','KOREKSI'].includes(proposal.status))||(proposal?.status==='KOREKSI'&&proposal.stage!=='OPERATOR'))throw new Error('Rincian hanya dapat diubah Operator pada draf atau koreksi yang telah diterima.')
  if(!values.title.trim())throw new Error('Nama kegiatan wajib diisi.')
  const items=values.items.map((item,index)=>({...item,id:index+1,total:Math.round(Number(item.volume||0)*Number(item.price||0)*100)/100}))
  const amount=items.reduce((n,i)=>n+i.total,0)
  if(items.some(i=>!Number.isFinite(i.total)||i.total<0))throw new Error('Volume dan harga harus berupa angka yang valid.')
  const cycle=submit?(proposal?.status==='KOREKSI'?(proposal.cycle||1)+1:proposal?.cycle||1):proposal?.cycle||1
  const record={...proposal,id:proposal?.id||`USL/2027/TI/${String(proposals.length+1).padStart(3,'0')}`,unitId:'TI',activity:'2144.QMA.002',title:values.title.trim(),proposer:'Siti Rahmawati (demo)',source:values.source,amount,account:items[0]?.account||'521211',category:accounts.find(a=>a.code===items[0]?.account)?.type||'Belum dipilih',draftItems:items,revisionNote:values.revisionNote,documentName:values.documentName,cycle,updated:timeNow(),status:proposal?.status||'DRAF',stage:proposal?.stage||'OPERATOR'}
  if(!submit)return record
  if(!items.length)throw new Error('Tambahkan sedikitnya satu item sebelum pengajuan.')
  items.forEach((i,index)=>{const n=index+1;if(!i.name.trim()||Number(i.volume)<=0||Number(i.price)<=0)throw new Error(`Item ${n}: uraian, volume, dan harga harus diisi positif.`);if(!accounts.some(a=>a.active&&a.code===i.account&&a.parent==='051.A'))throw new Error(`Item ${n}: pilih akun aktif pada subkomponen 051.A.`);if(!i.iku||Number(i.contribution)<=0)throw new Error(`Item ${n}: pilih IKU dan kontribusi rencana positif.`);if(i.months.length!==12||i.months.some(m=>!Number.isFinite(Number(m))||Number(m)<0)||Math.abs(i.months.reduce((n,m)=>n+Number(m),0)-i.total)>.005)throw new Error(`Item ${n}: total jadwal Januari–Desember harus sama dengan nominal item.`)})
  if(proposal?.status==='KOREKSI'&&!values.revisionNote.trim())throw new Error('Catatan tindak lanjut revisi wajib diisi.')
  const targetValues=Array.from({length:8},(_,i)=>ikus.find(k=>k.code===`IKU ${i+1}`&&k.year==='2027')?.target||0)
  for(let i=1;i<=8;i++){
    const key=`IKU ${i}`,contribution=items.filter(item=>item.iku===key).reduce((n,item)=>n+Number(item.contribution),0)
    const existing=proposals.filter(p=>p.id!==record.id&&(p.status==='DALAM_PROSES'||p.status==='TERVALIDASI'||(p.status==='KOREKSI'&&p.stage!=='OPERATOR'))).flatMap(p=>p.reviewSnapshot?.items||[]).filter(item=>item.iku===key).reduce((n,item)=>n+Number(item.contribution||0),0)
    if(contribution+existing>targetValues[i-1])throw new Error(`${key}: rencana kontribusi melebihi target contoh ${targetValues[i-1]}%.`)
  }
  const allocation=allocations.find(a=>a.unitId==='TI'&&a.year==='2027'&&a.source===values.source&&a.activity===record.activity)
  if(!allocation)throw new Error('Alokasi sumber dana tidak tersedia.')
  const usage=allocationUsage(proposals.filter(p=>p.id!==record.id),allocation)
  if(amount>usage.remaining)throw new Error(`Sisa pagu ${values.source} hanya ${usage.remaining.toLocaleString('id-ID')} rupiah. Kurangi rincian usulan.`)
  const snapshot={...getReviewSnapshot(record),cycle,items:items.map(i=>({...i,months:[...i.months]})),amount}
  const prior=proposal?.reviewSnapshot|| (proposal?.status==='KOREKSI'?getReviewSnapshot(proposal):null)
  return {...record,status:'DALAM_PROSES',stage:'PIMPINAN',reviewSnapshot:snapshot,archivedSnapshots:prior?[...(proposal.archivedSnapshots||[]),prior]:proposal?.archivedSnapshots||[],reviewHistory:[...(proposal?getReviewHistory(proposal):[]),{stage:'OPERATOR',action:'AJUKAN',actor:'Siti Rahmawati (demo)',note:values.revisionNote.trim()||'Usulan diajukan dari formulir contoh.',time:timeNow(),cycle}]}
}
export function editableItems(proposal) {
  if(proposal?.draftItems)return proposal.draftItems.map(i=>({...i,months:[...i.months]}))
  if(!proposal)return []
  const snapshot=getReviewSnapshot(proposal),plan=getMonthlyPlan(snapshot.items)
  return snapshot.items.map((i,index)=>({...i,iku:i.iku||'',contribution:i.contribution||'',months:i.months||plan[index].amounts}))
}
