import { useEffect, useState } from 'react'
import LoginPage from './pages/login/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'

const sessionKey = 'sipadu-demo-session'

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(sessionKey)) } catch { return null }
}

export default function App() {
  const [session, setSession] = useState(readSession)
  const [path, setPath] = useState(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setPath(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleLogin(user) {
    setSession(user)
    if (user.isDemo) sessionStorage.setItem(sessionKey, JSON.stringify(user))
    window.location.hash = '/dashboard'
    setPath('#/dashboard')
    window.scrollTo(0, 0)
  }

  function handleLogout() {
    sessionStorage.removeItem(sessionKey)
    setSession(null)
    window.location.hash = '/login'
    window.scrollTo(0, 0)
  }

  return session && path !== '#/login'
    ? <DashboardPage user={session} onLogout={handleLogout} />
    : <LoginPage onLogin={handleLogin} />
}
