import Icon from '../ui/Icon'
import InstitutionLogo from '../ui/InstitutionLogo'
import { ROLE_NAMES } from '../../features/dashboard/demoData'
import {getRoleProfile} from '../../features/dashboard/roleDashboard'
import { accountProfile } from '../../services/session'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'executive', label: 'Dashboard Eksekutif KPA', icon: 'chart', roles: ['ADMIN','KPA'] },
  { id: 'proposals', label: 'Usulan Anggaran', icon: 'file' },
  { id: 'form', label: 'Formulir Usul Anggaran', icon: 'edit', roles: ['OPERATOR'] },
  { id: 'reviews', label: 'Antrean Pemeriksaan', icon: 'review', counter: 'reviews' },
  { id: 'corrections', label: 'Antrean Koreksi', icon: 'info', counter: 'corrections' },
  { id: 'reports', label: 'Laporan (L01–L11)', icon: 'chart' },
]
const masters = [
  { id: 'masterAkuns', label: 'Master Akun Anggaran', icon: 'tree', liveOnly: true },
  { id: 'satuans', label: 'Master Satuan', icon: 'tree', liveOnly: true },
  { id: 'master', label: 'Master Hierarki Anggaran', icon: 'tree', roles: ['ADMIN','OPERATOR'] },
  { id: 'budget', label: 'Pagu & IKU', icon: 'pie' },
  { id: 'units', label: 'Unit Kerja & Jenis Belanja', icon: 'building', admin: true },
  { id: 'users', label: 'Pengguna & Hak Akses', icon: 'users', admin: true },
  { id: 'audit', label: 'Audit Aktivitas', icon: 'shield', roles: ['ADMIN','SPI','KPA'] },
]

export default function DashboardSidebar({ user, active, counts, onNavigate, onLogout, onClose }) {
  const isAdmin = user.role === 'ADMIN'
  const profile=accountProfile(user,getRoleProfile(user.role))
  return <>
    <div className="dash-sidebar-brand"><InstitutionLogo className="dash-brand-symbol" /><div><strong>POLINDRA</strong><small>USUL ANGGARAN</small></div>{onClose && <button className="dash-icon-button drawer-close" aria-label="Tutup menu" onClick={onClose}><Icon name="close" /></button>}</div>
    <div className="sidebar-navigation"><p className="nav-label">Menu Utama</p><nav aria-label="Menu utama">{navigation.filter(item => !item.roles || item.roles.includes(user.role)).map(item => <button key={item.id} type="button" className={`dash-nav-item${active === item.id ? ' active' : ''}`} aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.id === 'dashboard' && ['PIMPINAN','SAKIP'].includes(user.role) ? 'Dashboard Ringkasan' : item.label}</span>{item.counter && counts[item.counter] > 0 && <span className={`nav-counter ${item.counter}`}>{counts[item.counter]}</span>}</button>)}</nav>
    <p className="nav-label master-nav-label">Pengaturan & Master</p><nav aria-label="Pengaturan dan master">{masters.filter(item => (!item.liveOnly || !user.isDemo) && (!item.admin || isAdmin || (item.id === 'units' && !user.isDemo)) && (!item.roles || item.roles.includes(user.role))).map(item => <button type="button" key={item.id} className={`dash-nav-item${active === item.id ? ' active' : ''}`} aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.id === 'dashboard' && ['PIMPINAN','SAKIP'].includes(user.role) ? 'Dashboard Ringkasan' : (item.id === 'units' && !user.isDemo ? 'Daftar Unit Kerja' : item.id === 'budget' && !user.isDemo ? 'Daftar Pagu' : item.label)}</span></button>)}</nav></div>
    <div className="sidebar-profile"><div className="sidebar-profile-top"><div><strong>{profile.name}</strong><span>{profile.title || `${ROLE_NAMES[user.role]}${user.isDemo ? ' TI' : ''}`}</span></div><button className="dash-icon-button" type="button" onClick={onLogout} aria-label="Keluar dari akun" title="Keluar"><Icon name="logout" /></button></div><div className="sidebar-profile-bottom"><button onClick={() => onNavigate('help')}>Pusat Bantuan</button><span><i />{user.isDemo ? 'Mode demo' : 'Akun terhubung'}</span></div></div>
  </>
}
