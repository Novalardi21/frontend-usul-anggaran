import polindraLogo from '../../assets/POLINDRA.png'

export default function InstitutionLogo({ className = '' }) {
  return <img className={`institution-logo ${className}`} src={polindraLogo} alt="Logo Politeknik Negeri Indramayu" width="50" height="50" />
}
