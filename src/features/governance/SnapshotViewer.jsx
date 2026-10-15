import {useState} from 'react'
import ReviewItems from '../approvals/ReviewItems'
import {getReviewSnapshot} from '../approvals/reviewData'

export default function SnapshotViewer({proposal}){
  const snapshots=[...(proposal.archivedSnapshots||[]),getReviewSnapshot(proposal)]
  const [selected,setSelected]=useState(null)
  const snapshot=snapshots.find(s=>s.cycle===selected)||snapshots.at(-1)
  return <div className="work-stack"><label className="work-form">Lihat snapshot siklus (baca saja)<select aria-label="Pilih snapshot siklus" value={snapshot.cycle} onChange={e=>setSelected(Number(e.target.value))}>{snapshots.map((s,i)=><option key={i} value={s.cycle}>Siklus {s.cycle}{i===snapshots.length-1?' · Aktif':' · Arsip'}</option>)}</select></label><ReviewItems key={snapshot.cycle} snapshot={snapshot}/></div>
}
