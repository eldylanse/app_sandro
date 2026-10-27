import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound, Mail, Phone, Plus, Search, Target, Trash2, UserRound, X } from 'lucide-react'
import { registerClient } from '../../services/auth.service'
import { deleteClient, getClients, resetClientPassword } from '../../services/users.service'

const emptyForm = { nombre: '', email: '', celular: '', password: '', fecha_inicio_plan: '', fecha_termino_plan: '' }
const namePattern = /^\p{L}+(?:\s+\p{L}+)*$/u
const emailPattern = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.com$/i

function normalizeChileanPhone(value) {
  const raw = String(value || '').trim()
  if (!/^[+\d\s()-]+$/.test(raw)) return null
  const compact = raw.replace(/[\s()-]/g, '')
  const national = compact.replace(/^\+?56/, '')
  return /^9\d{8}$/.test(national) ? `+56${national}` : null
}

function planLabel(status) {
  return ({ activo: 'Activo', programado: 'Programado', finalizado: 'Finalizado', sin_plan: 'Sin plan' })[status] || 'Sin plan'
}

function planDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default function ClientsRoute() {
  const [clients, setClients] = useState([])
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [contactModalClient, setContactModalClient] = useState(null)
  const [resetModalClient, setResetModalClient] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const data = await getClients()
    setClients(data || [])
  }, [])

  useEffect(() => {
    let active = true
    getClients().then((data) => { if (active) setClients(data || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar los clientes.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleClients = clients.filter((client) => `${client.nombre} ${client.email} ${client.celular}`.toLowerCase().includes(query.toLowerCase()))

  async function submit(event) {
    event.preventDefault()
    const nombre = form.nombre.trim()
    const email = form.email.trim().toLowerCase()
    const celular = normalizeChileanPhone(form.celular)
    if (!namePattern.test(nombre)) {
      setError('El nombre solo puede contener letras y espacios.')
      return
    }
    if (!emailPattern.test(email)) {
      setError('Ingresa un correo válido que termine en .com.')
      return
    }
    if (!celular) {
      setError('Ingresa un celular chileno válido: 9 dígitos, con o sin el prefijo +56.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await registerClient({
        ...form,
        nombre,
        email,
        celular,
        fecha_inicio_plan: new Date(`${form.fecha_inicio_plan}T12:00:00`).toISOString(),
        fecha_termino_plan: new Date(`${form.fecha_termino_plan}T12:00:00`).toISOString(),
      })
      setForm(emptyForm)
      setShowForm(false)
      setNotice('Cliente creado correctamente. Ya puede iniciar sesión.')
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo crear el cliente.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(client) {
    if (!window.confirm(`¿Eliminar a ${client.nombre}? También se borrarán sus rutinas, reseñas, sesiones y ejercicios asociados.`)) return
    setError('')
    try {
      await deleteClient(client._id)
      setClients((current) => current.filter((item) => item._id !== client._id))
      setNotice(`${client.nombre} fue eliminado.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo eliminar el cliente.')
    }
  }

  function closeResetModal() {
    if (resetSaving) return
    setResetModalClient(null)
    setResetPassword('')
    setResetConfirmation('')
    setResetError('')
  }

  async function submitReset(event) {
    event.preventDefault()
    if (resetPassword !== resetConfirmation) {
      setResetError('Las contraseñas no coinciden.')
      return
    }
    setResetSaving(true)
    setResetError('')
    try {
      await resetClientPassword(resetModalClient._id, resetPassword)
      const name = resetModalClient.nombre
      setResetModalClient(null)
      setResetPassword('')
      setResetConfirmation('')
      setNotice(`Contraseña restablecida para ${name}. Comunícale la nueva contraseña por un canal seguro.`)
    } catch (requestError) {
      setResetError(requestError.response?.data?.message || 'No se pudo restablecer la contraseña.')
    } finally {
      setResetSaving(false)
    }
  }

  return <section className="admin-page">
    <div className="admin-page-heading"><div><div className="admin-kicker">GESTIÓN DE CLIENTES</div><h1>Tus <em>clientes.</em></h1><p>Administra perfiles, planes y accesos de tus atletas.</p></div><button className="button button-primary admin-action" onClick={() => { setShowForm(!showForm); setError('') }}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Cerrar formulario' : 'Agregar cliente'}</button></div>
    {error && <p className="admin-alert" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    {showForm && <form className="admin-form client-create-form" onSubmit={submit}><div className="admin-form-title"><UserRound size={18} /><div><h2>Nuevo cliente</h2><p>Se creará una cuenta de cliente sin registro público.</p></div></div><div className="admin-form-grid"><label>Nombre completo<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} pattern="[A-Za-zÀ-ÖØ-öø-ÿ]+([ ]+[A-Za-zÀ-ÖØ-öø-ÿ]+)*" title="Usa solo letras y espacios." required /></label><label>Correo electrónico<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} pattern="[^\s@]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.com" title="Ingresa un correo válido que termine en .com." required /></label><label>Celular<input type="tel" value={form.celular} onChange={(event) => setForm({ ...form, celular: event.target.value })} pattern="(\+?56[\s-]*)?9([\s-]*[0-9]){8}" title="Ingresa un celular chileno de 9 dígitos, con o sin el prefijo +56." placeholder="+56 9 1234 5678" required /></label><label>Contraseña inicial<div className="password-visibility-field"><input type={showPassword ? 'text' : 'password'} minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><label>Inicio del plan<input type="date" value={form.fecha_inicio_plan} onChange={(event) => setForm({ ...form, fecha_inicio_plan: event.target.value, ...(form.fecha_termino_plan && form.fecha_termino_plan < event.target.value ? { fecha_termino_plan: event.target.value } : {}) })} required /></label><label>Término del plan<input type="date" min={form.fecha_inicio_plan || undefined} value={form.fecha_termino_plan} onChange={(event) => setForm({ ...form, fecha_termino_plan: event.target.value })} required /></label></div><button className="button button-dark" disabled={saving}>{saving ? 'Creando…' : 'Crear cliente'}</button></form>}
    <div className="admin-list-toolbar"><div className="admin-result-count">{clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}</div><label className="admin-search"><Search size={16} /><input aria-label="Buscar clientes" placeholder="Buscar por nombre, correo o celular" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    {loading && <div className="admin-state">Cargando clientes…</div>}
    {!loading && !error && visibleClients.length === 0 && <div className="admin-empty"><UserRound size={21} /><strong>{query ? 'No encontramos coincidencias' : 'Todavía no hay clientes'}</strong><p>{query ? 'Prueba con otro nombre o correo.' : 'Agrega el primer cliente para comenzar.'}</p></div>}
    <div className="client-admin-list">{visibleClients.map((client) => { const hasActiveObjective = client.estadoPlan === 'activo' && Boolean(client.plan?.objetivo?.trim()); return <article className={`client-admin-card status-${client.estadoPlan || 'sin_plan'}${hasActiveObjective ? ' has-active-objective' : ''}`} key={client._id}><div className="admin-client-avatar">{client.nombre?.charAt(0)?.toUpperCase() || 'C'}</div><div className="admin-client-main"><div className="admin-client-heading"><h2>{client.nombre}</h2><span className={`plan-badge plan-${client.estadoPlan || 'sin_plan'}`}><i />{planLabel(client.estadoPlan)}</span></div><div className="admin-client-details"><span>{client.perfilCliente?.edad ? `${client.perfilCliente.edad} años` : 'Perfil pendiente'}</span><span>{client.perfilCliente?.peso ? `${client.perfilCliente.peso} kg` : 'Sin medición'}</span>{client.plan && <span>{client.plan.nombre}: {planDate(client.plan.fecha_inicio)} – {planDate(client.plan.fecha_termino)}</span>}</div><div className="client-admin-actions"><button className="button button-outline client-contact-trigger" type="button" onClick={() => setContactModalClient(client)}><Mail size={14} />Ver contacto</button><button className="button button-outline client-contact-trigger" type="button" onClick={() => { setResetModalClient(client); setResetError(''); setNotice('') }}><KeyRound size={14} />Restablecer contraseña</button></div></div>{hasActiveObjective && <aside className="admin-client-active-objective"><span><Target size={15} />Objetivo de la planificación</span><strong>{client.plan.objetivo}</strong></aside>}<button className="admin-icon-danger" aria-label={`Eliminar a ${client.nombre}`} title="Eliminar cliente" onClick={() => remove(client)}><Trash2 size={16} /></button></article> })}</div>
    {contactModalClient && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContactModalClient(null) }}><section className="admin-modal client-contact-modal" role="dialog" aria-modal="true" aria-labelledby="client-contact-title"><button className="admin-modal-close" type="button" aria-label="Cerrar contacto" onClick={() => setContactModalClient(null)}><X size={18} /></button><div className="admin-kicker">DATOS DEL CLIENTE</div><h2 id="client-contact-title">Contacto de {contactModalClient.nombre}</h2><div className="client-contact-details"><div><span><Mail size={17} />Correo electrónico</span>{contactModalClient.email ? <a href={`mailto:${contactModalClient.email}`}>{contactModalClient.email}</a> : <strong>No registrado</strong>}</div><div><span><Phone size={17} />Teléfono</span>{contactModalClient.celular ? <a href={`tel:${contactModalClient.celular.replace(/[^+\d]/g, '')}`}>{contactModalClient.celular}</a> : <strong>No registrado</strong>}</div></div><button className="button button-primary client-contact-close" type="button" onClick={() => setContactModalClient(null)}>Cerrar</button></section></div>}
    {resetModalClient && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeResetModal() }}><section className="admin-modal client-reset-modal" role="dialog" aria-modal="true" aria-labelledby="client-reset-title"><button className="admin-modal-close" type="button" aria-label="Cerrar" onClick={closeResetModal} disabled={resetSaving}><X size={18} /></button><div className="admin-kicker">ACCESO DEL CLIENTE</div><h2 id="client-reset-title">Restablecer contraseña de {resetModalClient.nombre}</h2><p>El cliente tendrá que iniciar sesión nuevamente con la contraseña que definas aquí.</p><form onSubmit={submitReset}><label>Nueva contraseña<input type="password" autoComplete="new-password" minLength="6" maxLength="128" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} required /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" minLength="6" maxLength="128" value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} required /></label>{resetError && <p className="admin-alert" role="alert">{resetError}</p>}<button className="button button-dark" type="submit" disabled={resetSaving}>{resetSaving ? 'Restableciendo…' : 'Guardar nueva contraseña'}</button></form></section></div>}
  </section>
}
