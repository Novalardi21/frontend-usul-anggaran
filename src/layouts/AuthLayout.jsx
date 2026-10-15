import Icon from '../components/ui/Icon'
import InstitutionLogo from '../components/ui/InstitutionLogo'

export default function AuthLayout({ children, onOpenInfo }) {
  return <div className="auth-layout">
    <a href="#login" className="skip-link">Langsung ke formulir login</a>
    <header className="institution-header"><div className="header-inner">
      <a className="institution-brand" href="./" aria-label="Beranda SIPADU Anggaran POLINDRA">
        <InstitutionLogo className="brand-mark" />
        <div><div className="brand-title"><strong>POLINDRA</strong><span>SIPADU ANGGARAN</span></div><p>Politeknik Negeri Indramayu • TA 2027</p></div>
      </a>
      <div className="header-meta"><span className="connection-badge"><span className="status-dot" />Portal Usulan Anggaran</span><span className="year-badge"><Icon name="calendar" />TA 2027: Pagu Indikatif</span></div>
    </div></header>
    <main className="auth-main">{children}</main>
    <footer className="institution-footer"><div className="footer-inner">
      <p><strong>© 2026 Politeknik Negeri Indramayu (POLINDRA)</strong><span className="footer-address">Jl. Lohbener Cantigi No. 08, Indramayu, Jawa Barat</span></p>
      <div className="footer-links"><span className="version-badge">v1.0 (Oktober 2026)</span><button type="button" onClick={() => onOpenInfo('guide')}>Panduan SBM PMK</button><button type="button" onClick={() => onOpenInfo('privacy')}>Kebijakan Privasi</button></div>
    </div></footer>
  </div>
}
