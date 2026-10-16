import { useEffect, useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import Icon from '../../components/ui/Icon'
import StatCard from '../../components/data-display/StatCard'
import Modal from '../../components/feedback/Modal'
import BudgetComposition from '../../features/dashboard/BudgetComposition'
import StatusDistribution from '../../features/dashboard/StatusDistribution'
import ProposalTable from '../../features/dashboard/ProposalTable'
import ProposalEditor from '../../features/dashboard/ProposalEditor'
import ProposalDetail from '../../features/dashboard/ProposalDetail'
import { DEMO_UNIT, FUNDING, ROLE_NAMES, getBudgetSummary } from '../../features/dashboard/demoData'
import { formatMoney } from '../../utils/format'
import { exportProposals } from '../../utils/exportCsv'
import './dashboard.css'
import ProposalsPage from '../usulan/ProposalsPage'
import ReviewQueuePage from '../antrean/ReviewQueuePage'
import { decideReview } from '../../features/approvals/reviewData'
import useGovernance from '../../features/governance/useGovernance'
import { ALL_PROPOSALS, unitName } from '../../features/governance/demo'
import ReportsPage from '../governance/ReportsPage'
import ExecutivePage from '../governance/ExecutivePage'
import MasterPage from '../governance/MasterPage'
import AllocationPage from '../governance/AllocationPage'
import UsersPage from '../governance/UsersPage'
import AuditPage from '../governance/AuditPage'
import CorrectionsPage from '../governance/CorrectionsPage'
import ProposalWorkspace from '../../features/governance/ProposalWorkspace'
import { Notice, Button } from '../../features/governance/Workbench'
import '../governance/governance.css'
import RoleDashboard from './RoleDashboard'
import {getRoleProfile} from '../../features/dashboard/roleDashboard'
import UnitsPage from '../governance/UnitsPage'
import SatuansPage from '../governance/SatuansPage'
import MasterAkunsPage from '../governance/MasterAkunsPage'
import PagusPage from '../governance/PagusPage'
import { accountProfile } from '../../services/session'

const sectionPaths = { dashboard: '/dashboard', approval: '/persetujuan-pimpinan', sakip: '/verifikasi-sakip', executive: '/dashboard-eksekutif', proposals: '/usulan-anggaran', form: '/formulir-usulan', reviews: '/antrean-pemeriksaan', corrections: '/antrean-koreksi', reports: '/laporan', master: '/master-anggaran', units: '/unit-kerja', satuans: '/master-satuan', masterAkuns: '/master-akun-anggaran', budget: '/pagu-iku', users: '/pengguna', audit: '/audit-aktivitas' }
const getSection = () => Object.keys(sectionPaths).find(key => `#${sectionPaths[key]}` === window.location.hash.split('?')[0]) || 'dashboard'

export default function DashboardPage({ user, onLogout }) {
  const [proposals, setProposals] = useState(ALL_PROPOSALS)
  const governance = useGovernance(user.role)
  const [formId,setFormId] = useState(null)
  const [year, setYear] = useState('2027')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [section, setSection] = useState(getSection)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [sakipMemo,setSakipMemo] = useState('')
  const profile=accountProfile(user,getRoleProfile(user.role))
  const unitScoped = ['OPERATOR','PIMPINAN'].includes(user.role)
  const scopedProposals = unitScoped ? proposals.filter(p => (p.unitId || 'TI') === 'TI') : proposals
  const current = year === '2027' ? scopedProposals : []
  const activeAllocations = governance.allocations.filter(a => a.year === year && (!unitScoped || a.unitId === 'TI'))
  const total = activeAllocations.reduce((sum,a) => sum+a.amount,0)
  const { validated, committed } = getBudgetSummary(current)
  const remaining = total - validated - committed
  const counts = { reviews: current.filter(item => item.status === 'DALAM_PROSES').length, corrections: current.filter(item => item.status === 'KOREKSI').length }
  const isOperator = user.role === 'OPERATOR'

  useEffect(() => { const titles={approval:'Persetujuan Kajur',sakip:'Verifikasi SAKIP',proposals:'Usulan Anggaran',reviews:'Antrean Pemeriksaan',corrections:'Antrean Koreksi',executive:'Dashboard Eksekutif KPA',form:'Formulir Usulan',reports:'Laporan L01–L11',master:'Master Anggaran',units:'Unit Kerja',satuans:'Master Satuan',masterAkuns:'Master Akun Anggaran',budget:user.isDemo?'Pagu & IKU':'Daftar Pagu',users:'Pengguna & Akses',audit:'Audit Aktivitas'}; document.title = `${titles[section] || 'Dashboard'} | SIPADU Anggaran POLINDRA`; return () => { document.title = 'Login | SIPADU Anggaran POLINDRA' } }, [section, user.isDemo])
  useEffect(() => {
    const onRouteChange = () => {
      if (['#/persetujuan-pimpinan', '#/verifikasi-sakip'].includes(window.location.hash.split('?')[0])) {
        window.location.replace('#/dashboard')
        return
      }
      if (!Object.values(sectionPaths).some(path => window.location.hash.split('?')[0] === `#${path}`)) return
      const next = getSection()
      setSection(next)
      setFilter(next === 'reviews' ? 'DALAM_PROSES' : next === 'corrections' ? 'KOREKSI' : 'ALL')
      setSearch('')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onRouteChange)
    if (['approval', 'sakip'].includes(getSection())) onRouteChange()
    return () => window.removeEventListener('hashchange', onRouteChange)
  }, [])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer) }, [toast])

  function changeYear(value) { setYear(value); setFilter('ALL'); setSearch('') }
  function focusTable() { requestAnimationFrame(() => document.getElementById('proposal-table')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })) }
  function applyFilter(value) { setFilter(value); focusTable() }
  function navigate(id) {
    if (Object.hasOwn(sectionPaths,id)) {
      setSection(id); setFilter(id === 'reviews' ? 'DALAM_PROSES' : id === 'corrections' ? 'KOREKSI' : 'ALL'); setSearch('')
      window.location.hash = sectionPaths[id]
      window.scrollTo(0, 0)
    } else setModal({ type: id })
  }
  function saveProposal(values) {
    const updated = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date()) + ' WIB'
    if (values.id) setProposals(previous => previous.map(item => item.id === values.id ? { ...item, ...values, updated } : item))
    else setProposals(previous => [{ ...values, id: `USL/2027/TI/${String(previous.length + 1).padStart(3, '0')}`, account: '521211', category: 'Bahan', status: 'DRAF', stage: 'OPERATOR', updated }, ...previous])
    setModal(null); setFilter(values.id ? 'ALL' : 'DRAF'); setSearch(''); setSection('proposals')
    window.history.replaceState(null, '', '#/usulan-anggaran')
    setToast(values.id ? 'Perubahan data contoh berhasil disimpan.' : 'Draf contoh berhasil dibuat. Draf belum mengikat pagu.'); focusTable()
  }
  const ratio = amount => total ? amount / total * 100 : 0
  const details = item => setModal({ type: 'detail', item })
  const edit = item => { setModal(null); setFormId(item.id); navigate('form') }
  function handleReviewDecision(id, decision, note) {
    const proposal = proposals.find(item => item.id === id)
    if (!proposal) throw new Error('Usulan tidak ditemukan. Muat ulang antrean.')
    const updated = decideReview(proposal, user.role, decision, note, `${profile.name} (demo)`)
    setProposals(previous => previous.map(item => item.id === id ? updated : item))
    governance.log('Pemeriksaan',decision === 'return' ? 'KEMBALIKAN' : user.role === 'KPA' ? 'VALIDASI' : 'VERIFIKASI',id,note || 'Keputusan pemeriksaan contoh.',proposal.stage,updated.stage || 'TERVALIDASI')
    setToast(decision === 'return' ? 'Usulan contoh dikembalikan satu tahap. Catatan dan riwayat tersimpan.' : 'Keputusan pemeriksaan contoh tersimpan. Tahap usulan diperbarui.')
  }

  function saveForm(record,submit){
    const old=proposals.find(p=>p.id===record.id)
    setProposals(previous=>old?previous.map(p=>p.id===record.id?record:p):[record,...previous])
    governance.log('Usulan',submit?'AJUKAN_USULAN':'SIMPAN_DRAF',record.id,submit?`Siklus ${record.cycle} masuk Pimpinan.`:`Rincian disimpan. ${old?.draftItems?.length||0} → ${record.draftItems.length} item.`,old?formatMoney(old.amount):'Usulan baru',formatMoney(record.amount))
    setToast(submit?'Usulan contoh berhasil diajukan ke Pimpinan.':'Draf contoh berhasil disimpan.')
    if(submit){setFormId(null);navigate('proposals')}
    else setFormId(record.id)
  }
  function updateCorrection(record,action){setProposals(previous=>previous.map(p=>p.id===record.id?record:p));governance.log('Koreksi',action,record.id,'Catatan diteruskan satu tahap tanpa mengubah rincian.');setToast('Koreksi contoh diteruskan ke tahap sebelumnya.')}
  function bulkDecision(ids,decision,note){
    if(user.role!=='KPA')throw new Error('Validasi akhir hanya untuk KPA.')
    if(!ids.length)throw new Error('Pilih setidaknya satu usulan.')
    const updates=ids.map(id=>{const p=proposals.find(r=>r.id===id);if(!p)throw new Error('Usulan tidak ditemukan.');return decideReview(p,user.role,decision,note)})
    setProposals(previous=>previous.map(p=>updates.find(r=>r.id===p.id)||p))
    updates.forEach(p=>governance.log('Pemeriksaan',decision==='return'?'KEMBALIKAN':'VALIDASI',p.id,note||'Validasi akhir contoh KPA.','KPA',p.stage||'TERVALIDASI'))
    setToast(`${updates.length} keputusan contoh tersimpan.`)
  }
  function openReview(p){window.location.assign(`#/antrean-pemeriksaan?usulan=${encodeURIComponent(p.id)}`);setSection('reviews');window.scrollTo(0,0)}
  function roleBatchDecision(ids,decision,note){
    if(!['PIMPINAN','SAKIP'].includes(user.role)||!ids.length)throw new Error('Tidak ada usulan yang dapat diputuskan oleh peran ini.')
    const updates=ids.map(id=>{const p=proposals.find(item=>item.id===id);if(!p||(user.role==='PIMPINAN'&&(p.unitId||'TI')!=='TI'))throw new Error('Usulan tidak tersedia dalam kewenangan unit Anda.');return decideReview(p,user.role,decision,note,`${profile.name} (demo)`)})
    setProposals(previous=>previous.map(p=>updates.find(item=>item.id===p.id)||p))
    updates.forEach(p=>governance.log('Pemeriksaan',decision==='return'?'KEMBALIKAN':user.role==='PIMPINAN'?'SETUJUI':'VERIFIKASI',p.id,note||'Rincian usulan contoh telah ditinjau.',user.role,p.stage))
    setToast(`${updates.length} usulan contoh ${decision==='return'?'dikembalikan satu tahap':user.role==='PIMPINAN'?'disetujui dan diteruskan ke SAKIP':'diverifikasi dan diteruskan ke SPI'}.`)
  }
  const adminOnly=(section==='users'||(section==='units'&&user.isDemo))&&user.role!=='ADMIN'
  const masterDenied=section==='master'&&!['ADMIN','OPERATOR'].includes(user.role)
  const executiveDenied=section==='executive'&&!['ADMIN','KPA'].includes(user.role)
  const auditDenied=section==='audit'&&!['ADMIN','SPI','KPA'].includes(user.role)
  const reviewRecords=current.map(p=>({...p,unitName:governance.units.find(u=>u.id===p.unitId)?.name||unitName(p.unitId||'TI'),sourceCeiling:governance.allocations.find(a=>a.unitId===(p.unitId||'TI')&&a.source===p.source&&a.year===year)?.amount||0}))
  const allAudit=[...governance.events,...proposals.flatMap(p=>(p.reviewHistory||[]).filter(e=>e.actor?.includes('(contoh)')).map((e,i)=>({id:`SEED-${p.id}-${i}`,iso:'2026-10-12T02:30:00.000Z',time:e.time,actor:e.actor,role:e.stage,module:'Pemeriksaan',action:e.action,target:p.id,note:e.note}))) ]
  let modulePage=null
  const roleRouteDenied=(section==='approval'&&user.role!=='PIMPINAN')||(section==='sakip'&&user.role!=='SAKIP')
  if(adminOnly||masterDenied||executiveDenied||auditDenied||roleRouteDenied)modulePage=<Notice>Akses halaman ini tidak tersedia untuk peran Anda. Gunakan menu sesuai peran aktif.</Notice>
  else if(section==='units'&&!user.isDemo)modulePage=<UnitsPage search={search} role={user.role}/>
  else if(section==='satuans')modulePage=user.isDemo?<Notice>Master satuan tersedia setelah terhubung ke backend.</Notice>:<SatuansPage search={search} role={user.role}/>
  else if(section==='masterAkuns')modulePage=user.isDemo?<Notice>Master akun anggaran tersedia setelah terhubung ke backend.</Notice>:<MasterAkunsPage search={search} role={user.role}/>
  else if(section==='budget'&&!user.isDemo)modulePage=<PagusPage search={search} role={user.role}/>
  else if(['dashboard','approval','sakip'].includes(section)&&['PIMPINAN','SAKIP'].includes(user.role))modulePage=<RoleDashboard key={`${user.role}-${year}`} role={user.role} proposals={proposals} allocations={governance.allocations} units={governance.units} ikus={governance.ikus} year={year} search={search} onDetail={openReview} onBatchDecision={roleBatchDecision} onCorrections={()=>navigate('corrections')} onReports={()=>{window.location.assign(`#/laporan?kode=${user.role==='PIMPINAN'?'L02':'L03'}`)}} onBudget={()=>{setModal(null);navigate('budget')}} memo={sakipMemo} onSaveMemo={value=>{setSakipMemo(value);governance.log('SAKIP','SIMPAN_MEMO','Memo telaah SAKIP',value||'Memo dikosongkan.');setToast('Memo SAKIP tersimpan dalam sesi contoh.')}}/>
  else if(section==='reports')modulePage=<ReportsPage proposals={scopedProposals} units={governance.units} role={user.role} year={year} search={search} notify={setToast}/>
  else if(section==='executive')modulePage=<ExecutivePage proposals={proposals} allocations={governance.allocations} ikus={governance.ikus} role={user.role} year={year} onDecision={bulkDecision} onDetail={openReview} notify={setToast}/>
  else if(['master','units'].includes(section))modulePage=<MasterPage key={section} mode={section} subcomponentRecords={governance.subcomponents} role={user.role} units={governance.units} accounts={governance.accounts} onSave={governance.save} search={search} onAudit={()=>navigate('audit')}/>
  else if(section==='budget')modulePage=<AllocationPage allocations={governance.allocations} units={governance.units} ikus={governance.ikus} proposals={proposals} role={user.role} year={year} search={search} onSave={governance.save} onAudit={()=>navigate('audit')} notify={setToast}/>
  else if(section==='users')modulePage=<UsersPage users={governance.users} units={governance.units} role={user.role} onSave={governance.save} search={search} onAudit={()=>navigate('audit')}/>
  else if(section==='audit')modulePage=<AuditPage events={allAudit} year={year} search={search}/>
  else if(section==='corrections')modulePage=<CorrectionsPage proposals={scopedProposals} allocations={governance.allocations} accounts={governance.accounts} ikus={governance.ikus} role={user.role} year={year} search={search} onUpdate={updateCorrection} onSaveForm={saveForm}/>
  else if(section==='form')modulePage=year!=='2027'?<Notice>Formulir contoh tersedia pada TA 2027.</Notice>:<><div className="work-actions" style={{marginBottom:20}}><Button secondary onClick={()=>setFormId(null)}>Buat Usulan Baru</Button>{scopedProposals.filter(p=>['DRAF','KOREKSI'].includes(p.status)&&p.stage==='OPERATOR').map(p=><Button key={p.id} secondary onClick={()=>setFormId(p.id)}>Ubah {p.id}</Button>)}</div><ProposalWorkspace key={formId||'new'} proposal={proposals.find(p=>p.id===formId)} proposals={proposals} allocations={governance.allocations} accounts={governance.accounts} ikus={governance.ikus} role={user.role} onSave={saveForm} onCancel={()=>navigate('proposals')}/></>

  return <DashboardLayout user={user} active={section} counts={counts} year={year} onYearChange={changeYear} search={search} onSearchChange={value => { setSearch(value) }} onNavigate={navigate} onLogout={onLogout} onNotifications={() => setModal({ type: 'notifications' })} onProfile={() => setModal({ type: 'profile' })}>
    {!user.isDemo && <Notice>Login, unit kerja, master satuan, master akun anggaran, dan daftar pagu sudah menggunakan backend. Perhitungan dashboard, usulan, IKU, pemeriksaan, dan laporan masih berupa simulasi data contoh.</Notice>}{modulePage || (section === 'reviews' ? <ReviewQueuePage key={year} proposals={reviewRecords} year={year} onYearChange={changeYear} role={user.role} search={search} onSearchChange={setSearch} onDecision={handleReviewDecision} /> : section === 'proposals' ? <ProposalsPage key={year} proposals={current} year={year} onYearChange={changeYear} search={search} onSearchChange={setSearch} filter={filter} onFilter={setFilter} role={user.role} remaining={remaining} onCreate={() => {setFormId(null);navigate('form')}} onDetail={details} onEdit={edit} onExport={() => setToast('Hasil filter berhasil diekspor sebagai CSV data contoh.')} /> : <>
    <section className="dash-card welcome-card"><div className="welcome-copy"><div><h1>Selamat Datang, {profile.shortName}</h1><span className="active-year"><i />TA {year}</span></div><p>Pantauan Usulan Anggaran POLINDRA — Tahun Anggaran {year}</p><span className="demo-tag"><Icon name="info" />Mode demo · Semua angka adalah data contoh</span></div><div className="welcome-actions"><div className="welcome-selects"><label className="unit-select"><Icon name="building" /><select aria-label="Unit kerja akun"><option>{unitScoped ? DEMO_UNIT : 'Semua unit dalam cakupan'}</option></select></label><label className="welcome-year"><Icon name="calendar" /><select aria-label="Pilih tahun anggaran" value={year} onChange={event => changeYear(event.target.value)}><option value="2027">TA 2027</option><option value="2026">TA 2026</option><option value="2025">TA 2025</option></select></label></div>{isOperator && <button className="dash-button" disabled={year !== '2027'} onClick={() => {setFormId(null);navigate('form')}}><Icon name="plus" />Buat Usulan Baru</button>}</div></section>
    {year !== '2027' && <div className="year-empty-notice"><Icon name="info" />Data contoh TA {year} belum tersedia. Pilih TA 2027 untuk mencoba dashboard.</div>}
    <div className="stats-grid"><StatCard label={unitScoped ? 'Total Pagu Unit' : 'Total Pagu Lintas Unit'} value={total} icon="wallet" helper={`BOPTN & PNBP alokasi ${year}`} percent={total ? 100 : 0} caption="Pagu" /><StatCard label="Sisa Dapat Diajukan" value={remaining} icon="savings" tone="success" helper="Kapasitas aman pengajuan" percent={ratio(remaining)} caption="Tersisa" /><StatCard label="Usulan Berjalan" value={committed} icon="swap" tone="info" helper={`${counts.reviews} usulan mengikat pagu`} percent={ratio(committed)} caption="Berjalan" /><StatCard label="Usulan Tervalidasi" value={validated} icon="shield" helper={`${current.filter(item => item.status === 'TERVALIDASI').length} usulan tuntas KPA`} percent={ratio(validated)} caption="Final" /></div>
    <div className="analytics-grid"><BudgetComposition allocations={activeAllocations} proposals={current} year={year} onDetails={() => navigate('budget')} /><StatusDistribution proposals={current} year={year} onFilter={applyFilter} /></div>
    <ProposalTable key={`${year}-${section}-${filter}-${search}`} proposals={current} year={year} search={search} filter={filter} onFilter={applyFilter} onDetail={details} onEdit={edit} role={user.role} section={section} />
    <div className="integration-note"><span className="integration-icon"><Icon name="shield" /></span><div><h2>Standar Indikator Kinerja Utama (IKU-PTN) & Rekap SAKTI Kemenkeu</h2><p>Usulan disusun mengikuti hierarki anggaran dan keterkaitan IKU. Perubahan pagu ditetapkan melalui keputusan resmi. Rekap disiapkan untuk input manual ke SAKTI.</p></div><span className="integration-pill">Data contoh</span><span className="integration-pill">API belum terhubung</span></div>
    </>)}
    <p className="dashboard-footer">© 2026 POLINDRA <span>SIPADU Anggaran · Prototipe antarmuka</span></p>
    {toast && <div className="dash-toast" role="status"><Icon name="check" />{toast}<button aria-label="Tutup pemberitahuan" onClick={() => setToast('')}><Icon name="close" /></button></div>}
    {modal?.type === 'editor' && <ProposalEditor proposal={modal.item} remaining={remaining} onSave={saveProposal} onClose={() => setModal(null)} />}
    {modal?.type === 'detail' && <ProposalDetail proposal={modal.item} canEdit={isOperator && ['DRAF', 'KOREKSI'].includes(modal.item.status)} onClose={() => setModal(null)} onEdit={edit} />}
    {modal && !['editor', 'detail'].includes(modal.type) && <Modal title={{ profile: 'Profil Pengguna', notifications: 'Notifikasi', budget: 'Rincian Pagu Unit', reports: 'Laporan Usulan Anggaran', help: 'Pusat Bantuan', settings: 'Pengaturan Akun', master: 'Master Anggaran', units: 'Unit Kerja', users: 'Pengguna & Hak Akses', audit: 'Audit Aktivitas' }[modal.type] || 'Informasi'} onClose={() => setModal(null)}>
      {modal.type === 'profile' && <><div className="profile-modal"><span className="dash-avatar">{profile.initials}</span><h3>{profile.name}</h3><p>{ROLE_NAMES[user.role]} · {user.isDemo ? DEMO_UNIT : user.unitName || user.unitId || 'Lintas unit'}</p></div><div className="modal-callout">{user.isDemo ? 'Identitas pengguna contoh untuk mencoba antarmuka.' : `Akun terhubung: ${user.email}. Peran mengikuti akun di server.`}</div><button className="dash-button logout-button" onClick={onLogout}><Icon name="logout" />Keluar ke Halaman Login</button></>}
      {modal.type === 'notifications' && <div className="notification-list">{current.filter(item => item.status === 'KOREKSI').length ? current.filter(item => item.status === 'KOREKSI').map(item => <button key={item.id} onClick={() => details(item)}><span className="notification-icon"><Icon name="alert" /></span><span><strong>Usulan memerlukan koreksi</strong><span>{item.title}</span><small>{item.updated}</small></span><Icon name="chevron" /></button>) : <p className="modal-intro">Tidak ada notifikasi pada tahun yang dipilih.</p>}</div>}
      {modal.type === 'budget' && <><p className="modal-intro">{DEMO_UNIT} · TA {year}. Pagu tidak dihitung sebagai realisasi pengeluaran.</p><div className="budget-modal-list">{FUNDING.map(fund => <div key={fund.code}><span>{fund.code}<small>{fund.name}</small></span><strong>{formatMoney(year === '2027' ? fund.ceiling : 0)}</strong></div>)}</div><div className="modal-callout"><strong>Sisa dapat diajukan: {formatMoney(remaining)}</strong><p>Total pagu dikurangi usulan tervalidasi dan komitmen berjalan. Draf dan koreksi yang sudah tiba di Operator tidak mengikat pagu.</p></div></>}
      {modal.type === 'reports' && <><p className="modal-intro">Unduh daftar data contoh untuk unit dan tahun yang sedang dipilih. Laporan resmi L01–L11 akan tersedia setelah modul laporan dan API terhubung.</p><div className="modal-callout">{current.length} usulan · {DEMO_UNIT} · TA {year}</div><button className="dash-button" onClick={() => { exportProposals(current, year); setToast('Daftar usulan contoh diekspor sebagai CSV.') }}><Icon name="download" />Unduh Data Contoh (CSV)</button></>}
      {modal.type === 'help' && <p className="modal-intro">Hubungi Unit Pelaksana Teknis TIK POLINDRA atau administrator unit kerja Anda untuk bantuan akun. Pada demo ini, coba pencarian, filter status, detail usulan, dan pembuatan draf.</p>}
      {modal.type === 'settings' && <><p className="modal-intro">{user.isDemo ? 'Peran demo' : 'Peran akun'}: <strong>{ROLE_NAMES[user.role]}</strong>. {user.isDemo ? 'Untuk mencoba peran lain, keluar dan pilih peran pada formulir login.' : 'Perubahan peran dikelola administrator di server.'}</p><div className="modal-callout">Preferensi dan pengaturan akun produksi belum terhubung pada prototipe.</div><button className="dash-button secondary" onClick={onLogout}>{user.isDemo ? 'Keluar & Ganti Peran' : 'Keluar'}</button></>}
      {['master', 'units', 'users', 'audit'].includes(modal.type) && <p className="modal-intro">Modul ini belum tersedia pada prototipe dashboard. Pengelolaan data dan audit akan dihubungkan ke API sesuai izin akun Admin.</p>}
    </Modal>}
  </DashboardLayout>
}
