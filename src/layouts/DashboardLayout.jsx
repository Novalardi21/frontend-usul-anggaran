import { useEffect, useRef, useState } from 'react'
import DashboardNavbar from '../components/layout/DashboardNavbar'
import DashboardSidebar from '../components/layout/DashboardSidebar'


export default function DashboardLayout({ children, user, active, counts, year, onYearChange, search, onSearchChange, onNavigate, onLogout, onNotifications, onProfile }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawer = useRef(null)
  useEffect(() => {
    if (drawerOpen && !drawer.current.open) drawer.current.showModal()
    if (!drawerOpen && drawer.current.open) drawer.current.close()
  }, [drawerOpen])
  const navigate = id => { setDrawerOpen(false); onNavigate(id) }
  const sidebarProps = { user, active, counts, onNavigate: navigate, onLogout }
  return <div className="dashboard-shell">
    <a className="dash-skip-link" href="#dashboard-content">Langsung ke konten dashboard</a>
    <aside className="dash-sidebar"><DashboardSidebar {...sidebarProps} /></aside>
    <dialog ref={drawer} className="dash-drawer" aria-label="Navigasi" onClose={() => setDrawerOpen(false)}><DashboardSidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} /></dialog>
    <DashboardNavbar user={user} active={active} counts={counts} year={year} onYearChange={onYearChange} search={search} onSearchChange={onSearchChange} onNavigate={onNavigate} onNotifications={onNotifications} onProfile={onProfile} onOpenMenu={() => setDrawerOpen(true)} />
    <main id="dashboard-content" className="dashboard-content" tabIndex={-1}>{children}</main>
  </div>
}

