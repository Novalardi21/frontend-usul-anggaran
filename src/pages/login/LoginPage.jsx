import { useState } from 'react'
import AuthLayout from '../../layouts/AuthLayout'
import LoginForm from '../../features/auth/LoginForm'
import { AUTH_INFO } from '../../features/auth/constants'
import Icon from '../../components/ui/Icon'
import InfoDialog from '../../components/feedback/InfoDialog'
import './login.css'
import { apiBaseUrl } from '../../services/api'

const features = [
  { icon: 'coin', title: 'Transparansi Pagu', description: 'Alokasi BOPTN & PNBP terdistribusi jelas dan akuntabel.' },
  { icon: 'chart', title: 'Sasaran 8 IKU', description: 'Hubungkan rencana program dengan indikator kinerja PT.' },
  { icon: 'shield', title: 'Validasi Bertingkat', description: 'Review Unit, SAKIP, SPI, hingga persetujuan Direktur.' },
]

export default function LoginPage({ onLogin }) {
  const [info, setInfo] = useState(null)
  const openInfo = key => setInfo(AUTH_INFO[key])
  return <AuthLayout onOpenInfo={openInfo}>
    <section className="portal-intro" aria-labelledby="portal-title">
      <span className="portal-badge"><Icon name="shield" />PORTAL PERENCANAAN POLINDRA</span>
      <h1 id="portal-title">Sistem Informasi<br />Perencanaan & <span>Usul<br className="desktop-break" /> Anggaran Terpadu</span></h1>
      <p className="intro-description">Perumusan RKA-K/L Tahun Anggaran 2027 Berbasis Standar Biaya Masukan (SBM) PMK, berorientasi capaian kinerja Tri Dharma Perguruan Tinggi, dan mendukung penyiapan rekap untuk SAKTI Kemenkeu RI.</p>
      <div className="feature-grid">{features.map(feature => <article className="feature-card" key={feature.title}><span className={`feature-icon ${feature.icon}`}><Icon name={feature.icon} /></span><h2>{feature.title}</h2><p>{feature.description}</p></article>)}</div>
      <div className="trust-notes"><span><Icon name="check" />Akses sesuai peran</span><span><Icon name="lock" />Akun dikelola institusi</span></div>
      <p className="institution-note">Perencanaan terarah • Penganggaran akuntabel</p>
    </section>
    <section className="login-card" aria-labelledby="login-title" id="login" tabIndex={-1}>
      <div className="login-heading"><h2 id="login-title">Selamat Datang Kembali</h2><p>Masukkan {apiBaseUrl ? 'email akun terdaftar' : 'NIP / Email Institusi'} dan kata sandi Anda untuk mengakses modul usulan anggaran.</p></div>
      <div className="active-period"><span className="period-icon"><Icon name="calendar" /></span><div><span className="period-label">Periode Perencanaan</span><strong>Tahun Anggaran 2027 (Pagu Indikatif)</strong></div><span className="phase-badge">FASE USULAN</span></div>
      <LoginForm onOpenInfo={openInfo} onSuccess={onLogin} />
      <div className="helpdesk"><Icon name="info" /><div><strong>Kendala Akses atau Reset Password?</strong><p>Hubungi Unit Pelaksana Teknis TIK POLINDRA atau administrator unit kerja Anda.</p></div></div>
    </section>
    <InfoDialog content={info} onClose={() => setInfo(null)} />
  </AuthLayout>
}
