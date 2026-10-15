import { useEffect, useState } from 'react'
import { Activity, CalendarDays, Dumbbell, LogOut, Menu, MessageSquareText, UsersRound, X } from 'lucide-react'
import ClientsRoute from './admin/ClientsRoute'
import ExercisesRoute from './admin/ExercisesRoute'
import PlanningRoute from './admin/PlanningRoute'
import ReviewsRoute from './admin/ReviewsRoute'
import SessionsRoute from './admin/SessionsRoute'
import './admin/admin.css'

const tabs = [
  { path: '/admin/clientes', label: 'Clientes', icon: UsersRound },
  { path: '/admin/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { path: '/admin/sesiones', label: 'Sesiones', icon: CalendarDays },
  { path: '/admin/planificacion', label: 'Planificación', icon: Activity },
  { path: '/admin/resenas', label: 'Reseñas', icon: MessageSquareText },
]

function getAdminId(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).id
  } catch {
    return null
  }
}

export default function AdminRoutes({ token, onLogout }) {
  const [path, setPath] = useState(window.location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const adminId = getAdminId(token)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    const initialPath = window.location.pathname
    if (initialPath === '/admin' || initialPath === '/admin/') {
      window.history.replaceState({}, '', tabs[0].path)
      setPath(tabs[0].path)
    }
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function navigate(destination) {
    window.history.pushState({}, '', destination)
    setPath(destination)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentPath = tabs.some((tab) => tab.path === path) ? path : tabs[0].path
  const activeTab = tabs.find((tab) => tab.path === currentPath) || tabs[0]
  let screen = null
  if (currentPath === '/admin/clientes') screen = <ClientsRoute />
  if (currentPath === '/admin/ejercicios') screen = <ExercisesRoute />
  if (currentPath === '/admin/sesiones') screen = <SessionsRoute adminId={adminId} />
  if (currentPath === '/admin/planificacion') screen = <PlanningRoute />
  if (currentPath === '/admin/resenas') screen = <ReviewsRoute />

  return <main className="admin-app">
    <header className="admin-topbar"><a className="brand" href="/admin/clientes" onClick={(event) => { event.preventDefault(); navigate(tabs[0].path) }}><span className="brand-mark"><Activity size={18} /></span><span>SANDRO<span className="brand-light">TRAINING</span><small className="admin-brand-tag">ADMIN</small></span></a><button className="admin-menu-toggle" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><nav className={`admin-nav${menuOpen ? ' is-open' : ''}`} aria-label="Navegación del administrador">{tabs.map(({ path: tabPath, label, icon: Icon }) => <button key={tabPath} className={currentPath === tabPath ? 'is-active' : ''} onClick={() => navigate(tabPath)}><Icon size={16} /><span>{label}</span></button>)}<button className="admin-logout" onClick={onLogout}><LogOut size={16} /><span>Cerrar sesión</span></button></nav></header>
    <div className="admin-welcome"><div><span>PANEL DEL PREPARADOR</span><strong>{activeTab.label}</strong></div><div className="admin-avatar">S</div></div>
    <div className="admin-content">{screen}</div>
    <footer className="admin-footer"><span>SANDRO TRAINING · ADMINISTRACIÓN</span><span>Entrena con propósito.</span></footer>
  </main>
}
