import { useEffect, useState } from 'react'
import { Activity, CalendarDays, HeartPulse, LockKeyhole, Mail, Phone, Plus, Ruler, Scale, UserRound, X } from 'lucide-react'
import { addClientMeasurement, changeClientPassword, getClientProfile } from '../../services/users.service'
import { getPlannings } from '../../services/plannings.service'

function formatDate(value) {
  if (!value) return 'Sin información'
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function ProfileRoute({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [plannings, setPlannings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weight, setWeight] = useState('')
  const [savingMeasurement, setSavingMeasurement] = useState(false)
  const [measurementMessage, setMeasurementMessage] = useState('')
  const [measurementError, setMeasurementError] = useState('')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    let active = true
    getClientProfile()
      .then((data) => { if (active) setProfile(data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudo cargar tu perfil.') })
      .finally(() => { if (active) setLoading(false) })
    getPlannings()
      .then((data) => { if (active) setPlannings(data.plannings || []) })
      .catch(() => { if (active) setPlannings([]) })
    return () => { active = false }
  }, [])

  async function submitMeasurement(event) {
    event.preventDefault()
    setSavingMeasurement(true)
    setMeasurementMessage('')
    setMeasurementError('')
    try {
      const updatedProfile = await addClientMeasurement({ peso: Number(weight) })
      setProfile(updatedProfile)
      setWeight('')
      setMeasurementMessage('Medición guardada correctamente.')
    } catch (requestError) {
      setMeasurementError(requestError.response?.data?.message || 'No se pudo guardar la medición.')
    } finally {
      setSavingMeasurement(false)
    }
  }

  function closePasswordModal() {
    if (savingPassword) return
    setPasswordModalOpen(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordError('')
  }

  async function submitPassword(event) {
    event.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.')
      return
    }
    setSavingPassword(true)
    setPasswordError('')
    try {
      await changeClientPassword(passwordForm.currentPassword, passwordForm.newPassword)
      closePasswordModal()
      window.alert('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
      onLogout()
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setSavingPassword(false)
    }
  }

  const client = profile?.perfilCliente || {}
  return <section className="client-page">
    <div className="client-page-heading"><div><div className="client-kicker">TU INFORMACIÓN PERSONAL</div><h1>Mi <em>perfil.</em></h1><p>Consulta los datos que ayudan a personalizar tu entrenamiento.</p></div></div>
    {loading && <div className="client-state">Cargando tu perfil…</div>}
    {error && <div className="client-state client-error">{error}</div>}
    {!loading && profile && <>
      <article className="profile-identity"><div className="profile-avatar"><UserRound size={26} /></div><div><h2>{profile.nombre}</h2><p><Mail size={14} /> {profile.email}</p>{profile.celular && <p><Phone size={14} /> {profile.celular}</p>}</div><button className="button button-outline profile-password-trigger" type="button" onClick={() => setPasswordModalOpen(true)}><LockKeyhole size={15} /> Cambiar contraseña</button></article>
      <div className="profile-metrics"><Metric icon={<UserRound size={18} />} label="Edad" value={client.edad ? `${client.edad} años` : '—'} /><Metric icon={<Ruler size={18} />} label="Estatura" value={client.altura ? `${client.altura} m` : '—'} /><Metric icon={<Scale size={18} />} label="Peso actual" value={client.peso ? `${client.peso} kg` : '—'} /><Metric icon={<Activity size={18} />} label="IMC" value={client.imc ?? '—'} /></div>
      {plannings.length > 0 && <section className="profile-goals"><div className="client-kicker">OBJETIVO DE TU PLANIFICACIÓN</div>{plannings.map((planning) => <article className="profile-goal-item" key={planning._id}><strong>{planning.nombre}</strong><p>{planning.objetivo || 'Tu preparador aún no ha definido un objetivo para esta planificación.'}</p></article>)}</section>}
      <div className="profile-details-grid"><article className="profile-detail-card"><div className="client-kicker"><HeartPulse size={14} /> INFORMACIÓN MÉDICA</div><p>{client.informacion_medica?.trim() || 'No has agregado información médica.'}</p><div className="profile-date-row"><span>Consentimiento registrado</span><strong>{client.terminos_aceptados ? 'Sí' : 'No'}</strong></div></article><article className="profile-detail-card"><div className="client-kicker"><CalendarDays size={14} /> TU PLAN ACTUAL</div><div className="profile-date-row"><span>Inicio</span><strong>{formatDate(client.fecha_inicio_plan)}</strong></div><div className="profile-date-row"><span>Término</span><strong>{formatDate(client.fecha_termino_plan)}</strong></div></article></div>
      <section className="measurements"><div className="agenda-day-heading"><div><span>SEGUIMIENTO</span><h2>Historial de mediciones</h2></div></div><form className="measurement-form" onSubmit={submitMeasurement}><label htmlFor="measurement-weight">Registrar peso (kg)</label><div><input id="measurement-weight" type="number" min="20" max="350" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Ej. 72.5" required /><button className="button button-dark" type="submit" disabled={savingMeasurement}><Plus size={16} />{savingMeasurement ? 'Guardando…' : 'Agregar medición'}</button></div>{measurementMessage && <p className="measurement-feedback" role="status">{measurementMessage}</p>}{measurementError && <p className="measurement-feedback client-error" role="alert">{measurementError}</p>}</form>{client.historial_mediciones?.length ? <div className="measurements-list">{[...client.historial_mediciones].reverse().map((measurement, index) => <div className="measurement-row" key={`${measurement.fecha}-${index}`}><span>{formatDate(measurement.fecha)}</span><strong>{measurement.peso} kg</strong><small>IMC {measurement.imc ?? '—'}</small></div>)}</div> : <p className="measurements-empty">Aún no hay mediciones anteriores.</p>}</section>
    </>}
    {passwordModalOpen && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePasswordModal() }}><section className="profile-password-modal" role="dialog" aria-modal="true" aria-labelledby="profile-password-title"><button className="profile-modal-close" type="button" aria-label="Cerrar" onClick={closePasswordModal} disabled={savingPassword}><X size={18} /></button><div className="client-kicker">SEGURIDAD DE TU CUENTA</div><h2 id="profile-password-title">Cambiar contraseña</h2><p>Ingresa tu contraseña actual y elige una nueva. Tendrás que iniciar sesión nuevamente.</p><form onSubmit={submitPassword}><label>Contraseña actual<input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></label><label>Nueva contraseña<input type="password" autoComplete="new-password" minLength="6" maxLength="128" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required /></label><label>Confirmar nueva contraseña<input type="password" autoComplete="new-password" minLength="6" maxLength="128" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required /></label>{passwordError && <p className="profile-password-error" role="alert">{passwordError}</p>}<button className="button button-dark" type="submit" disabled={savingPassword}>{savingPassword ? 'Guardando…' : 'Guardar contraseña'}</button></form></section></div>}
  </section>
}

function Metric({ icon, label, value }) {
  return <article className="profile-metric"><div>{icon}<span>{label}</span></div><strong>{value}</strong></article>
}
