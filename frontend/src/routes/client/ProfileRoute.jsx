import { useEffect, useState } from 'react'
import { Activity, CalendarDays, HeartPulse, Mail, Phone, Plus, Ruler, Scale, UserRound } from 'lucide-react'
import { addClientMeasurement, getClientProfile } from '../../services/users.service'

function formatDate(value) {
  if (!value) return 'Sin información'
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function ProfileRoute() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weight, setWeight] = useState('')
  const [savingMeasurement, setSavingMeasurement] = useState(false)
  const [measurementMessage, setMeasurementMessage] = useState('')
  const [measurementError, setMeasurementError] = useState('')

  useEffect(() => {
    let active = true
    getClientProfile()
      .then((data) => { if (active) setProfile(data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudo cargar tu perfil.') })
      .finally(() => { if (active) setLoading(false) })
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

  const client = profile?.perfilCliente || {}
  return <section className="client-page">
    <div className="client-page-heading"><div><div className="client-kicker">TU INFORMACIÓN PERSONAL</div><h1>Mi <em>perfil.</em></h1><p>Consulta los datos que ayudan a personalizar tu entrenamiento.</p></div></div>
    {loading && <div className="client-state">Cargando tu perfil…</div>}
    {error && <div className="client-state client-error">{error}</div>}
    {!loading && profile && <>
      <article className="profile-identity"><div className="profile-avatar"><UserRound size={26} /></div><div><h2>{profile.nombre}</h2><p><Mail size={14} /> {profile.email}</p>{profile.celular && <p><Phone size={14} /> {profile.celular}</p>}</div></article>
      <div className="profile-metrics"><Metric icon={<UserRound size={18} />} label="Edad" value={client.edad ? `${client.edad} años` : '—'} /><Metric icon={<Ruler size={18} />} label="Estatura" value={client.altura ? `${client.altura} m` : '—'} /><Metric icon={<Scale size={18} />} label="Peso actual" value={client.peso ? `${client.peso} kg` : '—'} /><Metric icon={<Activity size={18} />} label="IMC" value={client.imc ?? '—'} /></div>
      <div className="profile-details-grid"><article className="profile-detail-card"><div className="client-kicker"><HeartPulse size={14} /> INFORMACIÓN MÉDICA</div><p>{client.informacion_medica?.trim() || 'No has agregado información médica.'}</p><div className="profile-date-row"><span>Consentimiento registrado</span><strong>{client.terminos_aceptados ? 'Sí' : 'No'}</strong></div></article><article className="profile-detail-card"><div className="client-kicker"><CalendarDays size={14} /> TU PLAN ACTUAL</div><div className="profile-date-row"><span>Inicio</span><strong>{formatDate(client.fecha_inicio_plan)}</strong></div><div className="profile-date-row"><span>Término</span><strong>{formatDate(client.fecha_termino_plan)}</strong></div></article></div>
      <section className="measurements"><div className="agenda-day-heading"><div><span>SEGUIMIENTO</span><h2>Historial de mediciones</h2></div></div><form className="measurement-form" onSubmit={submitMeasurement}><label htmlFor="measurement-weight">Registrar peso (kg)</label><div><input id="measurement-weight" type="number" min="20" max="350" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Ej. 72.5" required /><button className="button button-dark" type="submit" disabled={savingMeasurement}><Plus size={16} />{savingMeasurement ? 'Guardando…' : 'Agregar medición'}</button></div>{measurementMessage && <p className="measurement-feedback" role="status">{measurementMessage}</p>}{measurementError && <p className="measurement-feedback client-error" role="alert">{measurementError}</p>}</form>{client.historial_mediciones?.length ? <div className="measurements-list">{[...client.historial_mediciones].reverse().map((measurement, index) => <div className="measurement-row" key={`${measurement.fecha}-${index}`}><span>{formatDate(measurement.fecha)}</span><strong>{measurement.peso} kg</strong><small>IMC {measurement.imc ?? '—'}</small></div>)}</div> : <p className="measurements-empty">Aún no hay mediciones anteriores.</p>}</section>
    </>}
  </section>
}

function Metric({ icon, label, value }) {
  return <article className="profile-metric"><div>{icon}<span>{label}</span></div><strong>{value}</strong></article>
}
