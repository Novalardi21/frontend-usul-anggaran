import test from 'node:test'
import assert from 'node:assert/strict'
import {ALL_PROPOSALS,ALLOCATIONS,ACCOUNTS,IKUS,allocationUsage,isBound} from './demo.js'
import {forwardCorrection,saveProposalForm} from './workflow.js'
import {decideReview} from '../approvals/reviewData.js'
import {selectRoleDashboard,splitSubunitAllocation} from '../dashboard/roleDashboard.js'
import {UNITS} from './demo.js'

const values=()=>({title:'Praktikum contoh',source:'PNBP',revisionNote:'Rincian dan jadwal telah diperbaiki.',documentName:'TOR.pdf',items:[{id:1,account:'521211',name:'Bahan praktikum',description:'Bahan pendukung',volume:2,unit:'Paket',price:100000,iku:'IKU 2',contribution:1,months:[0,0,200000,0,0,0,0,0,0,0,0,0]}]})
test('koreksi turun satu tahap, tanpa mengubah rincian atau melepas komitmen sebelum Operator',()=>{
  const p=ALL_PROPOSALS.find(p=>p.id.endsWith('/010'))
  assert.throws(()=>forwardCorrection(p,'SPI'),/tahap aktif/)
  const first=forwardCorrection(p,'SAKIP','Catatan diteruskan')
  assert.equal(first.stage,'PIMPINAN');assert.equal(first.amount,p.amount);assert.equal(isBound(first),true)
  const second=forwardCorrection(first,'PIMPINAN')
  assert.equal(second.stage,'OPERATOR');assert.equal(isBound(second),false)
  assert.equal(second.reviewSnapshot,first.reviewSnapshot)
  assert.equal(p.stage,'SAKIP')
})
test('pengajuan ulang membuat siklus baru dan mempertahankan snapshot lama',()=>{
  const p=ALL_PROPOSALS[0],old=JSON.stringify(p)
  const revised=saveProposalForm(p,values(),true,'OPERATOR',ALL_PROPOSALS,ALLOCATIONS,ACCOUNTS)
  assert.equal(revised.cycle,2);assert.equal(revised.stage,'PIMPINAN');assert.equal(revised.status,'DALAM_PROSES')
  assert.equal(revised.amount,200000);assert.equal(revised.reviewSnapshot.cycle,2)
  assert.equal(revised.archivedSnapshots[0].amount,p.amount);assert.equal(revised.archivedSnapshots[0].cycle,1)
  assert.equal(JSON.stringify(p),old)
})
test('pengajuan menolak peran, saldo sumber dana, jadwal dan IKU tidak valid',()=>{
  const submit=v=>saveProposalForm(null,v,true,'OPERATOR',ALL_PROPOSALS,ALLOCATIONS,ACCOUNTS)
  assert.throws(()=>saveProposalForm(null,values(),true,'ADMIN',ALL_PROPOSALS,ALLOCATIONS,ACCOUNTS),/Operator/)
  const schedule=values();schedule.items[0].months[2]=0;assert.throws(()=>submit(schedule),/jadwal/)
  const account=values();account.items[0].account='521811';assert.throws(()=>submit(account),/akun aktif/)
  const iku=values();iku.items[0].contribution=100;assert.throws(()=>submit(iku),/kontribusi melebihi/)
  const balance=values();balance.items[0].price=500000000;balance.items[0].months[2]=1000000000;assert.throws(()=>submit(balance),/Sisa pagu PNBP/)
  const lowTargets=IKUS.map(i=>({...i,target:0}));assert.throws(()=>saveProposalForm(null,values(),true,'OPERATOR',ALL_PROPOSALS,ALLOCATIONS,ACCOUNTS,lowTargets),/target contoh/)
})
test('saldo dipisah menurut unit, kegiatan, dan sumber dana',()=>{
  const a=ALLOCATIONS.find(a=>a.unitId==='TI'&&a.source==='PNBP'),usage=allocationUsage(ALL_PROPOSALS,a)
  assert.equal(usage.validated,100000000);assert.equal(usage.committed,407400000)
  assert.equal(usage.remaining,242600000)
  assert.equal(allocationUsage(ALL_PROPOSALS,{...a,activity:'kegiatan-lain'}).remaining,a.amount)
})
test('validasi KPA mengunci usulan dan tidak dapat diputuskan ulang',()=>{
  const p=ALL_PROPOSALS.find(p=>p.stage==='KPA'),final=decideReview(p,'KPA','approve','Layak')
  assert.equal(final.status,'TERVALIDASI');assert.equal(final.stage,null)
  assert.throws(()=>decideReview(final,'KPA','approve',''),/tahap aktif/)
  assert.throws(()=>saveProposalForm(final,values(),false,'OPERATOR',ALL_PROPOSALS,ALLOCATIONS,ACCOUNTS),/Operator/)
})

test('dashboard Kajur dibatasi TI dan ringkasan mengikuti keputusan terbaru',()=>{
  const base={proposals:ALL_PROPOSALS,allocations:ALLOCATIONS,units:UNITS,ikus:IKUS,role:'PIMPINAN',year:'2027'}
  const before=selectRoleDashboard(base)
  assert.ok(before.records.every(p=>p.unitId==='TI'))
  assert.ok(before.queue.every(p=>p.stage==='PIMPINAN'&&p.status==='DALAM_PROSES'))
  const proposal=before.queue[0],approved=decideReview(proposal,'PIMPINAN','approve','Sesuai kebutuhan unit')
  const after=selectRoleDashboard({...base,proposals:ALL_PROPOSALS.map(p=>p.id===approved.id?approved:p)})
  assert.equal(after.pending.length,before.pending.length-1)
  assert.equal(after.passed.length,before.passed.length+1)
  assert.equal(after.remaining,before.remaining)
  assert.equal(splitSubunitAllocation(before.total).reduce((n,u)=>n+u.amount,0),before.total)
})

test('dashboard SAKIP menggabungkan filter unit, sumber, IKU, dan tahun',()=>{
  const base={proposals:ALL_PROPOSALS,allocations:ALLOCATIONS,units:UNITS,ikus:IKUS,role:'SAKIP',year:'2027'}
  const full=selectRoleDashboard(base)
  assert.ok(full.queue.every(p=>p.stage==='SAKIP'&&p.status==='DALAM_PROSES'))
  const filtered=selectRoleDashboard({...base,unitId:'TI',source:'PNBP',iku:'IKU 2',search:'BNSP'})
  assert.equal(filtered.queue.length,1)
  assert.equal(filtered.queue[0].id,'USL/2027/TI/003')
  assert.equal(selectRoleDashboard({...base,unitId:'TM'}).queue.length,0)
  const empty=selectRoleDashboard({...base,year:'2026'})
  assert.equal(empty.records.length,0);assert.equal(empty.total,0);assert.equal(empty.indicators.length,0)
})
