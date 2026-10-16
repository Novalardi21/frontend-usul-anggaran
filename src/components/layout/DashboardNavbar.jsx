import Icon from '../ui/Icon'
import { ROLE_NAMES } from '../../features/dashboard/demoData'
import {getRoleProfile} from '../../features/dashboard/roleDashboard'
import { accountProfile } from '../../services/session'

export default function DashboardNavbar({ user, active, counts, year, onYearChange, search, onSearchChange, onNavigate, onNotifications, onProfile, onOpenMenu }) {
  const profile=accountProfile(user,getRoleProfile(user.role))
  return (
    <header className="dash-topbar">
      <button className="dash-icon-button mobile-menu-button" aria-label="Buka menu navigasi" onClick={onOpenMenu}><Icon name="menu" /></button>
      <div className="dash-breadcrumb"><Icon name="wallet" /><span>SIPADU</span><span>/</span><strong>{{ approval: 'Persetujuan Kajur', sakip: 'Verifikasi SAKIP', proposals: 'Usulan Anggaran', reviews: 'Antrean Pemeriksaan', corrections: 'Antrean Koreksi', executive: 'Eksekutif KPA', form: 'Formulir Usulan', reports: 'Laporan L01–L11', master: 'Master Anggaran', units: 'Unit Kerja', satuans: 'Master Satuan', masterAkuns: 'Master Akun Anggaran', budget: user.isDemo ? 'Pagu & IKU' : 'Daftar Pagu', users: 'Pengguna & Akses', audit: 'Audit Aktivitas' }[active] || 'Dashboard'} · TA {year}</strong></div>
      <label className="dash-search"><Icon name="search" /><span className="sr-only">Cari usulan, kegiatan, kode akun</span><input type="search" placeholder="Cari usulan, kegiatan, kode akun…" value={search} onChange={event => onSearchChange(event.target.value)} /></label>
      <div className="dash-topbar-actions">{['PIMPINAN','SAKIP'].includes(user.role)&&<span className="dash-role-scope"><Icon name="building"/>{user.role==='PIMPINAN'?(user.isDemo?'Unit: Jurusan TI':'Unit: ' + (user.unitName || user.unitId || 'Belum ditetapkan')):'Cakupan: Lintas Unit'}</span>}<label className="dash-year-picker"><Icon name="calendar" /><span className="year-prefix">Tahun Anggaran:</span><select aria-label="Tahun anggaran dashboard" value={year} onChange={event => onYearChange(event.target.value)}><option value="2027">2027</option><option value="2026">2026</option><option value="2025">2025</option></select></label>
      <button className="dash-icon-button notification-button" type="button" aria-label={`Notifikasi, ${counts.corrections} usulan perlu koreksi`} onClick={onNotifications}><Icon name="bell" />{counts.corrections > 0 && <i />}</button>
      <button className="dash-icon-button settings-button" type="button" aria-label="Pengaturan akun" onClick={() => onNavigate('settings')}><Icon name="settings" /></button>
      <button className="dash-user" onClick={onProfile} type="button" aria-label="Buka profil akun"><span className="dash-avatar">{profile.initials}</span><span className="dash-user-label"><strong>{profile.shortName}</strong><small>{profile.title || ROLE_NAMES[user.role]}</small></span></button></div>
    </header>
  )
}
