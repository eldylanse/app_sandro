import { useEffect, useState } from 'react'
import { Activity, CalendarDays, LogOut, Menu, MessageSquareText, UserRound, X } from 'lucide-react'
import { getClientProfile } from '../services/users.service'
import AgendaRoute from './client/AgendaRoute'
import ProfileRoute from './client/ProfileRoute'
import ProfileOnboardingRoute from './client/ProfileOnboardingRoute'
import ReviewsRoute from './client/ReviewsRoute'
import RoutinesRoute from './client/RoutinesRoute'
import { isClientProfileComplete } from './client/profile-complete'
import './client/client.css'

const tabs = [
  { path: '/cliente/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/cliente/perfil', label: 'Perfil', icon: UserRound },
  { path: '/cliente/resenas', label: 'Reseñas', icon: MessageSquareText },
]

const onboardingPath = '/cliente/perfil-inicial'

export default function ClienteRoutes({ onLogout }) {
  const [path, setPath] = useState(window.location.pathname)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let active = true
    getClientProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
        const complete = isClientProfileComplete(data)
        const currentPath = window.location.pathname
        const canonicalPath = complete
          ? (currentPath === '/cliente' || currentPath === onboardingPath ? tabs[0].path : currentPath)
          : onboardingPath
        if (canonicalPath !== currentPath) {
          window.history.replaceState({}, '', canonicalPath)
          setPath(canonicalPath)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'No pudimos cargar tu perfil. Vuelve a iniciar sesión.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function navigate(destination, replace = false) {
    if (replace) window.history.replaceState({}, '', destination)
    else window.history.pushState({}, '', destination)
    setPath(window.location.pathname)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <main className="client-loading"><div className="client-icon-badge"><Activity size={20} /></div><p>Preparando tu espacio…</p></main>
  if (error) return <main className="client-loading"><div className="client-error-panel"><h1>No pudimos cargar tu espacio</h1><p>{error}</p><button className="button button-outline" onClick={onLogout}>Cerrar sesión</button></div></main>

  if (!isClientProfileComplete(profile)) {
    return <main className="client-app client-onboarding-shell"><header className="client-topbar"><a className="brand" href="/cliente" onClick={(event) => { event.preventDefault(); navigate(onboardingPath) }}><span className="brand-mark"><Activity size={18} /></span><span>SANDRO<span className="brand-light">TRAINING</span></span></a><button className="button button-outline" onClick={onLogout}><LogOut size={15} /> Cerrar sesión</button></header><ProfileOnboardingRoute onComplete={(result) => { setProfile(result); navigate(tabs[0].path, true) }} /></main>
  }

  const currentPath = path === '/cliente/rutinas' ? path : tabs.some((tab) => tab.path === path) ? path : tabs[0].path
  const activeTab = tabs.find((tab) => tab.path === currentPath) || { label: 'Rutinas' }
  let screen = null
  if (currentPath === '/cliente/agenda') screen = <AgendaRoute onOpenRoutine={({ planningId, microcycleIndex, dayIndex }) => {
    const params = new URLSearchParams({ planning: planningId, cycle: String(microcycleIndex), day: String(dayIndex) })
    navigate(`/cliente/rutinas?${params.toString()}`)
  }} />
  if (currentPath === '/cliente/perfil') screen = <ProfileRoute />
  if (currentPath === '/cliente/rutinas') screen = <RoutinesRoute onBackToAgenda={() => navigate('/cliente/agenda')} />
  if (currentPath === '/cliente/resenas') screen = <ReviewsRoute />

  return <main className="client-app">
    <header className="client-topbar"><a className="brand" href="/cliente/agenda" onClick={(event) => { event.preventDefault(); navigate(tabs[0].path) }}><span className="brand-mark"><Activity size={18} /></span><span>SANDRO<span className="brand-light">TRAINING</span></span></a><button className="client-menu-toggle" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><nav className={`client-nav${menuOpen ? ' is-open' : ''}`} aria-label="Navegación del cliente">{tabs.map(({ path: tabPath, label, icon: Icon }) => <button key={tabPath} className={currentPath === tabPath ? 'is-active' : ''} onClick={() => navigate(tabPath)}><Icon size={16} /><span>{label}</span></button>)}<button className="client-logout" onClick={onLogout}><LogOut size={16} /><span>Cerrar sesión</span></button></nav></header>
    <div className="client-welcome"><div><span>HOLA, {profile.nombre?.split(' ')[0]?.toUpperCase()}</span><strong>{activeTab.label}</strong></div><div className="client-welcome-avatar">{profile.nombre?.charAt(0)?.toUpperCase() || 'A'}</div></div>
    <div className="client-content">{screen}</div>
    <footer className="client-footer"><span>SANDRO TRAINING</span><span>Entrena con propósito.</span></footer>
  </main>
}
