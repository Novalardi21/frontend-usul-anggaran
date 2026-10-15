import { useState } from 'react'
import { PageHeading, Button, Metric, Notice, Tabs, Table, Empty } from '../../features/governance/Workbench'
import { REPORTS, downloadCsv, unitName } from '../../features/governance/demo'
import { getReviewSnapshot, getMonthlyPlan } from '../../features/approvals/reviewData'
import { formatMoney } from '../../utils/format'

const initialFilters = { unit:'ALL', source:'ALL', status:'ALL' }
export default function ReportsPage({ proposals, units, role, year, search, notify }) {
  const [code,setCode]=useState(()=>{const requested=new URLSearchParams(window.location.hash.split('?')[1]||'').get('kode');return REPORTS.some(r=>r[0]===requested&&(!r[2]||r[2].includes(role)))?requested:'L01'})
  const [draft,setDraft]=useState(initialFilters)
  const [filters,setFilters]=useState(initialFilters)
  const report=REPORTS.find(r=>r[0]===code)
  const allowed=REPORTS.filter(r=>!r[2] || r[2].includes(role))
  const scoped=['OPERATOR','PIMPINAN'].includes(role)?proposals.filter(p=>p.unitId==='TI'):proposals
  const selected=scoped.filter(p=>(filters.unit==='ALL'||p.unitId===filters.unit)&&(filters.source==='ALL'||p.source===filters.source)&&(filters.status==='ALL'||p.status===filters.status)&&`${p.id} ${p.title} ${unitName(p.unitId)}`.toLowerCase().includes(search.toLowerCase()))
  const stage={L02:'PIMPINAN',L03:'SAKIP',L04:'SPI',L05:'KPA'}[code]
  const data=year!=='2027'?[]:selected.filter(p=>stage?p.status==='DALAM_PROSES'&&p.stage===stage:code==='L06'?p.account==='521211':code==='L07'?p.account.startsWith('53'):code==='L08'?p.account==='521213':code==='L09'?p.account.startsWith('524'):true)
  let headers=['Nomor Usulan','Unit Kerja','Nama Kegiatan','Sumber','Nominal (Rp)','Status','Tahap']
  let rows=data.map(p=>[p.id,unitName(p.unitId),p.title,p.source,p.amount,p.status,p.stage||'Selesai'])
  if(code==='L01'){
    headers=['Kode Unit','Nama Unit Kerja','Tervalidasi (Rp)','Dalam Proses (Rp)','Koreksi (Rp)','Draf (Rp)','Total Usulan (Rp)']
    rows=units.map(u=>{const list=data.filter(p=>p.unitId===u.id);return [u.id,u.name,...['TERVALIDASI','DALAM_PROSES','KOREKSI','DRAF'].map(s=>list.filter(p=>p.status===s).reduce((n,p)=>n+p.amount,0)),list.reduce((n,p)=>n+p.amount,0)]}).filter(row=>row[6]>0)
  }
  if(code==='L10'){
    headers=['Usulan','Item','Sumber',...['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],'Total (Rp)']
    rows=data.flatMap(p=>{const snapshot=getReviewSnapshot(p);return snapshot.items.map((item,i)=>[p.id,item.name,p.source,...(item.months||getMonthlyPlan(snapshot.items)[i].amounts),item.total])})
  }
  if(code==='L11'){
    headers=['Usulan','Subkomponen','IKU','Item','Kontribusi Rencana','Tahun','Nominal Item (Rp)']
    rows=data.flatMap(p=>getReviewSnapshot(p).items.map(item=>[p.id,'051.A',item.iku||'Belum dipetakan',item.name,item.contribution||'Belum ditetapkan','2027',item.total]))
  }
  function exportCsv(){downloadCsv(`${code}-${year}`,headers,rows);notify('Laporan contoh sesuai filter berhasil diekspor.')}
  async function copy(){try{await navigator.clipboard.writeText([['DATA CONTOH',code,report[1]],headers,...rows].map(r=>r.join('\t')).join('\n'));notify('Rekap contoh tersalin untuk lembar kerja manual.')}catch{notify('Clipboard tidak tersedia. Gunakan ekspor CSV.')}}
  return <div className="governance-page"><PageHeading eyebrow="ARSIP & REKAPITULASI KEUANGAN" title="Pusat Laporan Anggaran L01–L11" description="Rekapitulasi usulan, status pemeriksaan, dan rencana penarikan sesuai cakupan akun."><Button icon="file" secondary onClick={copy}>Salin Rekap Manual SAKTI</Button><Button icon="download" secondary onClick={exportCsv}>Ekspor Spreadsheet (CSV)</Button><Button icon="download" onClick={()=>window.print()}>Cetak / Simpan PDF Contoh</Button></PageHeading>
    <section className="dash-card work-panel"><div className="work-section-title"><h2>Daftar Kode Laporan Standar</h2><small>{allowed.length} laporan sesuai peran Anda</small></div><Tabs items={allowed.map(r=>[r[0],`${r[0]} · ${r[1]}`])} value={code} onChange={setCode}/></section>
    <section className="dash-card work-panel"><div className="work-filters"><label>Unit kerja<select value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value})}><option value="ALL">{['OPERATOR','PIMPINAN'].includes(role)?'Unit sendiri · TI':'Semua unit'}</option>{units.filter(u=>!['OPERATOR','PIMPINAN'].includes(role)||u.id==='TI').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Sumber dana<select value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}><option value="ALL">Semua sumber</option><option>BOPTN</option><option>PNBP</option></select></label><label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="ALL">Semua status</option>{['DRAF','DALAM_PROSES','KOREKSI','TERVALIDASI'].map(s=><option key={s}>{s}</option>)}</select></label><Button onClick={()=>setFilters({...draft})}>Terapkan Filter</Button><Button secondary onClick={()=>{setDraft(initialFilters);setFilters(initialFilters)}}>Reset</Button></div></section>
    <div className="work-stats three"><Metric label="Usulan hasil filter" value={`${data.length} Usulan`} detail={`TA ${year} · ${filters.source==='ALL'?'BOPTN & PNBP':filters.source}`} icon="file"/><Metric label="Total nominal hasil filter" value={formatMoney(data.reduce((n,p)=>n+p.amount,0))} detail="Nilai usulan perencanaan, bukan realisasi" icon="coin" tone="success"/><Metric label="Jumlah baris laporan" value={rows.length} detail={`${code} · ${report[1]}`} icon="chart"/></div>
    <Notice><strong>{code}: {report[1]}</strong><p>Filter aktif: TA {year} · {filters.unit==='ALL'?'Semua unit dalam cakupan':unitName(filters.unit)} · {filters.source} · {filters.status}. Ekspor menggunakan hasil yang sama dengan tabel.</p></Notice>
    <section className="dash-card"><div className="work-panel work-section-title"><h2>Rekapitulasi {code}</h2><span className="work-pill">{rows.length} baris</span></div><Table caption={report[1]} headers={headers}>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} className={typeof cell==='number'?'numeric':''}>{typeof cell==='number'?cell.toLocaleString('id-ID'):cell}</td>)}</tr>)}</Table>{!rows.length&&<Empty/>}<div className="work-total">Total nominal usulan: {formatMoney(data.reduce((n,p)=>n+p.amount,0))}</div></section>
    <Notice><strong>Rekap untuk input manual SAKTI</strong><p>Dokumen ini berupa data contoh. Nomor register, pengesahan, integrasi SAKTI, tanda tangan elektronik, serta laporan resmi membutuhkan backend dan otorisasi institusi.</p></Notice>
  </div>
}
