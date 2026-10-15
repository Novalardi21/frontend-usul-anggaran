import { useRef, useState } from 'react'
import FormField from '../../components/forms/FormField'
import Icon from '../../components/ui/Icon'
import { login } from '../../services/auth'
import { ROLES } from './constants'

export default function LoginForm({ onOpenInfo, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    const identifier = data.identifier.trim()
    const nextErrors = {}
    if (!identifier) nextErrors.identifier = 'Masukkan NIP atau email institusi Anda.'
    else if (!/^\d{18}$/.test(identifier) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) nextErrors.identifier = 'Gunakan NIP 18 digit atau alamat email yang valid.'
    if (!data.password) nextErrors.password = 'Masukkan kata sandi Anda.'
    if (!ROLES.some(role => role.value === data.role)) nextErrors.role = 'Pilih peran pengguna Anda.'
    setErrors(nextErrors)
    setFeedback(null)
    if (Object.keys(nextErrors).length) {
      form.elements.namedItem(Object.keys(nextErrors)[0]).focus()
      return
    }
    submitting.current = true
    setLoading(true)
    try {
      const result = await login({ identifier, password: data.password, role: data.role, remember_session: data.remember_session === 'on' })
      form.elements.namedItem('password').value = ''
      onSuccess({ role: data.role, isDemo: result.isDemo })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  function clearError(event) {
    const name = event.target.name
    if (errors[name]) setErrors(previous => ({ ...previous, [name]: undefined }))
    if (feedback) setFeedback(null)
  }

  return <form className="login-form" onSubmit={handleSubmit} onChange={clearError} noValidate aria-busy={loading}>
    {!import.meta.env.VITE_API_BASE_URL && <div className="demo-login-note"><Icon name="info" /><span><strong>Mode demo</strong> — gunakan NIP 18 digit atau email valid dan kata sandi apa saja untuk melihat dashboard data contoh.</span></div>}
    {feedback && <div className={`form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}><Icon name="info" /><span>{feedback.message}</span></div>}
    <FormField id="identifier" label="NIP Pegawai / Email Institusi" icon="user" error={errors.identifier}>
      <input id="identifier" name="identifier" autoComplete="username" placeholder="198705122015042001 atau nama@polindra.ac.id" required aria-invalid={!!errors.identifier} aria-describedby={errors.identifier ? 'identifier-error' : undefined} />
    </FormField>
    <FormField id="password" label="Kata Sandi" icon="lock" error={errors.password}>
      <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan kata sandi akun" required aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
      <button type="button" className="password-toggle icon-button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'eyeOff' : 'eye'} /></button>
    </FormField>
    <FormField id="role" label="Peran Pengguna (Role Masuk)" icon="shield" error={errors.role}>
      <select id="role" name="role" defaultValue="OPERATOR" required aria-invalid={!!errors.role} aria-describedby={errors.role ? 'role-error' : undefined}>{ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select><Icon name="chevron" className="select-chevron" />
    </FormField>
    <div className="form-options"><label className="remember-session"><input type="checkbox" name="remember_session" /><span>Ingat sesi di perangkat ini <span className="muted">(Maks. 8 jam)</span></span></label><button className="text-button" type="button" onClick={() => onOpenInfo('password')}>Lupa Kata Sandi?</button></div>
    <button className="primary-button" type="submit" disabled={loading}>{loading ? <><span className="spinner" />Memproses login…</> : <>Masuk ke Sistem Penganggaran<Icon name="arrow" /></>}</button>
    <div className="login-divider"><span>atau opsi login</span></div>
    <button className="sso-button" type="button" disabled={loading} onClick={() => onOpenInfo('sso')}><Icon name="fingerprint" />Masuk dengan Akun Kampus (SSO POLINDRA)</button>
  </form>
}
