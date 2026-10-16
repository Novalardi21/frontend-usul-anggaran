import { useEffect, useState } from 'react'
import LoginPage from './pages/login/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import { apiBaseUrl } from './services/api'
import { getSession, logout } from './services/auth'

const sessionKey = 'sipadu-demo-session'

function readSession() {
  if (apiBaseUrl) return null
  try {
    const user = JSON.parse(sessionStorage.getItem(sessionKey))
    return user?.isDemo ? user : null
  } catch { return null }
}

export default function App() {
  const [session, setSession] = useState(readSession)
  const [path, setPath] = useState(window.location.hash)
  const [checking, setChecking] = useState(Boolean(apiBaseUrl))
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!apiBaseUrl) return
    const controller = new AbortController()
    getSession(controller.signal).then(user => {
      if (!controller.signal.aborted) { setSession(user); setChecking(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message); setChecking(false) }
    })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    const onHashChange = () => setPath(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleLogin(user) {
    setError('')
    setSession(user)
    if (user.isDemo) sessionStorage.setItem(sessionKey, JSON.stringify(user))
    window.location.hash = '/dashboard'
    setPath('#/dashboard')
    window.scrollTo(0, 0)
  }

  async function handleLogout() {
    try {
      if (session && !session.isDemo) await logout()
    } catch (reason) {
      setError(reason.message)
      return
    }
    setError('')
    sessionStorage.removeItem(sessionKey)
    setSession(null)
    window.location.hash = '/login'
    window.scrollTo(0, 0)
  }

  if (checking) return <main className="work-panel" role="status">Memeriksa sesi akun…</main>
  if (error && !session) return <main className="work-panel"><p role="alert">{error}</p><button onClick={() => { setError(''); setChecking(true); setAttempt(value => value + 1) }}>Coba hubungkan kembali</button></main>

  return <>{error && <p className="work-notice warning" role="alert">{error}</p>}{session && path !== '#/login'
    ? <DashboardPage user={session} onLogout={handleLogout} />
    : <LoginPage onLogin={handleLogin} />}</>
}
