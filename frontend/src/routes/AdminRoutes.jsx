import { useEffect, useState } from 'react'
import { Activity, CalendarDays, Dumbbell, KeyRound, LogOut, Menu, MessageSquareText, UsersRound, X } from 'lucide-react'
import { changeAdminPassword } from '../services/users.service'
import ClientsRoute from './admin/ClientsRoute'
import ExercisesRoute from './admin/ExercisesRoute'
import PlanningRoute from './admin/PlanningRoute'
import ReviewsRoute from './admin/ReviewsRoute'
import SessionsRoute from './admin/SessionsRoute'
import brandIcon from '../assets/icon.png'
import './admin/admin.css'
import './admin/admin-readability.css'
import './admin/client-cards.css'
import './admin/password-reset.css'
import './client/password-modal.css'

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
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
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

  async function submitPassword(event) {
    event.preventDefault()
    setPasswordError('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordError('Las contraseñas nuevas no coinciden.')
    setPasswordSaving(true)
    try {
      await changeAdminPassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordOpen(false)
      onLogout()
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setPasswordSaving(false)
    }
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
    <header className="admin-topbar"><a className="brand" href="/admin/clientes" onClick={(event) => { event.preventDefault(); navigate(tabs[0].path) }}><span className="brand-mark"><img src={brandIcon} alt="" /></span><span>TRIBU<span className="brand-light">FIT</span><small className="admin-brand-tag">ADMIN</small></span></a><button className="admin-menu-toggle" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><nav className={`admin-nav${menuOpen ? ' is-open' : ''}`} aria-label="Navegación del administrador">{tabs.map(({ path: tabPath, label, icon: Icon }) => <button key={tabPath} className={currentPath === tabPath ? 'is-active' : ''} onClick={() => navigate(tabPath)}><Icon size={16} /><span>{label}</span></button>)}<button type="button" onClick={() => setPasswordOpen(true)}><KeyRound size={16} /><span>Cambiar contraseña</span></button><button className="admin-logout" onClick={onLogout}><LogOut size={16} /><span>Cerrar sesión</span></button></nav></header>
    <div className="admin-welcome"><div><span>PANEL DEL PREPARADOR</span><strong>{activeTab.label}</strong></div><div className="admin-avatar">S</div></div>
    <div className="admin-content">{screen}</div>
    <footer className="admin-footer"><span>TRIBU FIT · ADMINISTRACIÓN</span><span>Entrena con propósito.</span></footer>
    {passwordOpen && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !passwordSaving) setPasswordOpen(false) }}><section className="profile-password-modal" role="dialog" aria-modal="true" aria-labelledby="admin-password-title"><button className="profile-modal-close" type="button" aria-label="Cerrar" onClick={() => setPasswordOpen(false)}><X size={18} /></button><div className="client-kicker">SEGURIDAD DE TU CUENTA</div><h2 id="admin-password-title">Cambiar contraseña</h2><p>Ingresa tu contraseña actual y elige una nueva. Se cerrará tu sesión al guardar.</p><form onSubmit={submitPassword}><label>Contraseña actual<input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></label><label>Nueva contraseña<input type="password" autoComplete="new-password" minLength="6" maxLength="128" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required /></label><label>Confirmar nueva contraseña<input type="password" autoComplete="new-password" minLength="6" maxLength="128" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required /></label>{passwordError && <p className="profile-password-error" role="alert">{passwordError}</p>}<button className="button button-dark" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Guardando…' : 'Guardar contraseña'}</button></form></section></div>}
  </main>
}
