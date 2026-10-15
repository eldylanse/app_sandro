import { useEffect, useState } from 'react'
import { CalendarDays, ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { getClients } from '../../services/users.service'
import { cancelSession, createSession, getSessions, updateSession } from '../../services/sessions.service'

function dateTime(value) {
  if (!value) return 'Fecha pendiente'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function SessionsRoute({ adminId }) {
  const [sessions, setSessions] = useState([])
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id_cliente: '', fecha_reunion: '', notas: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refresh() {
    const response = await getSessions()
    setSessions(response.data || [])
  }

  useEffect(() => {
    let active = true
    Promise.all([getSessions(), getClients()])
      .then(([sessionResponse, clientList]) => {
        if (!active) return
        setSessions(sessionResponse.data || [])
        setClients(clientList || [])
        if (clientList?.length) setForm((current) => ({ ...current, id_cliente: current.id_cliente || clientList[0]._id }))
      })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar las sesiones.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    if (!adminId) return setError('No pudimos identificar la cuenta administradora.')
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createSession({ ...form, id_admin: adminId, fecha_reunion: new Date(form.fecha_reunion).toISOString() })
      setShowForm(false)
      setNotice('Sesión agendada y enlace generado.')
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo agendar la sesión. Revisa que Google Meet esté conectado en la cuenta administradora.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(session, estado) {
    try {
      if (estado === 'cancelada') await cancelSession(session._id)
      else await updateSession(session._id, { estado })
      await refresh()
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo actualizar la sesión.')
    }
  }

  async function remove(session) {
    if (!window.confirm(`¿Cancelar la sesión de ${session.id_cliente?.nombre || 'este cliente'}?`)) return
    try {
      await cancelSession(session._id)
      await refresh()
      setNotice('La sesión quedó cancelada.')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo cancelar la sesión.')
    }
  }

  return <section className="admin-page">
    <div className="admin-page-heading"><div><div className="admin-kicker">AGENDA Y ACOMPAÑAMIENTO</div><h1>Sesiones <em>agendadas.</em></h1><p>Coordina reuniones de seguimiento y revisa sus enlaces.</p></div><button className="button button-primary admin-action" onClick={() => { setShowForm(!showForm); setError('') }}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Cerrar' : 'Agendar sesión'}</button></div>
    {error && <p className="admin-alert" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    {showForm && <form className="admin-form session-create-form" onSubmit={submit}><h2>Nueva sesión</h2><div className="admin-form-grid"><label>Cliente<select required value={form.id_cliente} onChange={(event) => setForm({ ...form, id_cliente: event.target.value })}><option value="" disabled>Selecciona un cliente</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.nombre} · {client.email}</option>)}</select></label><label>Fecha y hora<input type="datetime-local" required value={form.fecha_reunion} onChange={(event) => setForm({ ...form, fecha_reunion: event.target.value })} /></label><label className="admin-field-wide">Notas<textarea rows="2" value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} placeholder="Temas para revisar en la sesión" /></label></div>{!clients.length && <p className="admin-alert">Primero debes crear un cliente.</p>}<button className="button button-dark" disabled={saving || !clients.length}>{saving ? 'Agendando…' : 'Crear sesión y Meet'}</button></form>}
    {loading && <div className="admin-state">Cargando sesiones…</div>}
    {!loading && !sessions.length && <div className="admin-empty"><CalendarDays size={21} /><strong>No hay sesiones agendadas</strong><p>Las próximas reuniones aparecerán aquí.</p></div>}
    <div className="session-admin-list">{sessions.map((session) => <article className="session-admin-card" key={session._id}><div className="session-admin-date"><CalendarDays size={18} /><span>{dateTime(session.fecha_reunion)}</span></div><div className="session-admin-info"><h2>{session.id_cliente?.nombre || 'Cliente'}</h2><p>{session.notas || 'Sesión de seguimiento'}</p>{session.id_cliente?.email && <small>{session.id_cliente.email}</small>}</div><div className="session-admin-actions"><select aria-label="Estado de la sesión" value={session.estado} onChange={(event) => changeStatus(session, event.target.value)}><option value="pendiente">Pendiente</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select>{session.link_meet && <a href={session.link_meet} target="_blank" rel="noreferrer" title="Abrir Google Meet"><ExternalLink size={15} /></a>}{session.estado !== 'cancelada' && <button className="admin-icon-danger" aria-label="Cancelar sesión" onClick={() => remove(session)}><Trash2 size={15} /></button>}</div></article>)}</div>
  </section>
}
