import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, CalendarPlus, Check, ClipboardList, Copy, Dumbbell, Edit3, Plus, Search, Target, Trash2, UsersRound, X } from 'lucide-react'
import { getExercises } from '../../services/exercises.service'
import { createPlanning, deletePlanning, getPlanningSurveys, getPlannings, updatePlanning } from '../../services/plannings.service'
import { getClients } from '../../services/users.service'
import './planning-surveys.css'
import './planning-editor-layout.css'

function todayInput() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function futureInput() {
  const future = new Date()
  future.setDate(future.getDate() + 1)
  return `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`
}

function newDay(date = futureInput()) {
  return { fecha: date, finalizado: false, ejercicios: [] }
}

function inputDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function displayDate(value, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  if (!value) return 'Fecha pendiente'
  const date = new Date(`${inputDate(value)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? 'Fecha pendiente' : new Intl.DateTimeFormat('es-CL', options).format(date)
}

function freshForm(clientId = '') {
  return { id_cliente: clientId, nombre: '', objetivo: '', fecha_inicio: futureInput(), fecha_termino: '', microciclos: [{ numero_semana: 1, dias_entrenamiento: [newDay()] }] }
}

function fromPlanning(planning) {
  return {
    id_cliente: planning.id_cliente?._id || planning.id_cliente || '',
    nombre: planning.nombre || '',
    objetivo: planning.objetivo || '',
    fecha_inicio: inputDate(planning.fecha_inicio),
    fecha_termino: inputDate(planning.fecha_termino),
    microciclos: (planning.microciclos || []).map((week, weekIndex) => ({
      numero_semana: week.numero_semana || weekIndex + 1,
      dias_entrenamiento: (week.dias_entrenamiento || []).map((day) => ({
        fecha: inputDate(day.fecha),
        finalizado: Boolean(day.finalizado),
        ejercicios: (day.ejercicios || []).map((exercise) => ({
          id_ejercicio: exercise.id_ejercicio?._id || exercise.id_ejercicio || '',
          series_planificadas: exercise.series_planificadas ?? 3,
          peso_planificado: exercise.peso_planificado ?? '',
          tipo_objetivo: exercise.tipo_objetivo || 'repeticiones',
          repeticiones_planificadas: exercise.repeticiones_planificadas || '8-12',
          tiempo_segundos: exercise.tiempo_segundos ?? 30,
          historial_rendimiento: exercise.historial_rendimiento || [],
        })),
      })),
    })),
  }
}

export default function PlanningRoute() {
  const [clients, setClients] = useState([])
  const [exercises, setExercises] = useState([])
  const [plannings, setPlannings] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [exerciseFilter, setExerciseFilter] = useState('')
  const [exerciseCategory, setExerciseCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingPlanningId, setEditingPlanningId] = useState(null)
  const [deletingPlanningId, setDeletingPlanningId] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [form, setForm] = useState(() => freshForm())
  const [surveyModalPlanning, setSurveyModalPlanning] = useState(null)
  const [surveyModalDay, setSurveyModalDay] = useState(null)
  const [planningSurveys, setPlanningSurveys] = useState([])
  const [loadingPlanningSurveys, setLoadingPlanningSurveys] = useState(false)
  const [planningSurveyError, setPlanningSurveyError] = useState('')

  const exerciseCategories = useMemo(() => [...new Set(exercises.map((exercise) => exercise.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [exercises])
  const visibleExercises = useMemo(
    () => exercises.filter((exercise) => {
      const matchesCategory = !exerciseCategory || exercise.categoria === exerciseCategory
      const matchesQuery = !exerciseFilter || `${exercise.nombre} ${exercise.categoria}`.toLowerCase().includes(exerciseFilter.toLowerCase())
      return matchesCategory && matchesQuery
    }),
    [exercises, exerciseCategory, exerciseFilter],
  )
  const visiblePlannings = useMemo(() => plannings.filter((planning) => !clientFilter || (planning.id_cliente?._id || planning.id_cliente) === clientFilter), [plannings, clientFilter])
  const isEditing = Boolean(editingPlanningId)

  async function refreshPlannings() {
    const response = await getPlannings()
    setPlannings(response.plannings || [])
  }

  useEffect(() => {
    let active = true
    Promise.all([getClients(), getExercises(), getPlannings()])
      .then(([clientList, exerciseResponse, planningResponse]) => {
        if (!active) return
        setClients(clientList || [])
        setExercises(exerciseResponse.exercises || [])
        setPlannings(planningResponse.plannings || [])
        if (clientList?.length) setForm((current) => ({ ...current, id_cliente: clientList[0]._id }))
      })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar los clientes y las planificaciones.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!surveyModalPlanning || !surveyModalDay) return undefined
    let active = true
    setLoadingPlanningSurveys(true)
    setPlanningSurveyError('')
    setPlanningSurveys([])
    getPlanningSurveys(surveyModalPlanning._id)
      .then((response) => {
        if (!active) return
        setPlanningSurveys((response.surveys || []).filter((survey) => survey.id_dia_entrenamiento === surveyModalDay._id))
      })
      .catch((requestError) => { if (active) setPlanningSurveyError(requestError.response?.data?.message || 'No se pudieron cargar las respuestas de esta planificación.') })
      .finally(() => { if (active) setLoadingPlanningSurveys(false) })
    return () => { active = false }
  }, [surveyModalPlanning, surveyModalDay])

  function openNewPlanning() {
    setEditingPlanningId(null)
    setForm(freshForm(clients[0]?._id || ''))
    setError('')
    setNotice('')
    setEditorOpen(true)
  }

  function openEditPlanning(planning) {
    setEditingPlanningId(planning._id)
    setForm(fromPlanning(planning))
    setError('')
    setNotice('')
    setEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditingPlanningId(null)
    setError('')
  }

  function updateWeek(weekIndex, transform) {
    setForm((current) => ({ ...current, microciclos: current.microciclos.map((week, index) => index === weekIndex ? transform(week) : week) }))
  }

  function updateDay(weekIndex, dayIndex, transform) {
    updateWeek(weekIndex, (week) => ({ ...week, dias_entrenamiento: week.dias_entrenamiento.map((day, index) => index === dayIndex ? transform(day) : day) }))
  }

  function addWeek(copyPrevious = false) {
    setForm((current) => {
      const source = copyPrevious ? current.microciclos[current.microciclos.length - 1] : null
      const days = source ? source.dias_entrenamiento.flatMap((day) => {
        const nextDate = new Date(`${day.fecha}T12:00:00`)
        nextDate.setDate(nextDate.getDate() + 7)
        const date = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
        if (current.fecha_termino && date > current.fecha_termino) return []
        return [{ ...day, fecha: date, finalizado: false, ejercicios: day.ejercicios.map((exercise) => ({ ...exercise, historial_rendimiento: [] })) }]
      }) : []
      return { ...current, microciclos: [...current.microciclos, { numero_semana: current.microciclos.length + 1, dias_entrenamiento: days }] }
    })
  }

  function addDay(weekIndex) {
    setForm((current) => {
      const week = current.microciclos[weekIndex]
      const dates = week.dias_entrenamiento.map((day) => day.fecha).filter(Boolean).sort()
      const dateAfterLast = dates.length ? new Date(`${dates[dates.length - 1]}T12:00:00`) : new Date(`${current.fecha_inicio || futureInput()}T12:00:00`)
      if (dates.length) dateAfterLast.setDate(dateAfterLast.getDate() + 1)
      const minDate = isEditing ? todayInput() : futureInput()
      const proposed = `${dateAfterLast.getFullYear()}-${String(dateAfterLast.getMonth() + 1).padStart(2, '0')}-${String(dateAfterLast.getDate()).padStart(2, '0')}`
      const date = proposed < minDate ? minDate : proposed
      return { ...current, microciclos: current.microciclos.map((item, index) => index === weekIndex ? { ...item, dias_entrenamiento: [...item.dias_entrenamiento, newDay(date)] } : item) }
    })
  }

  function removeWeek(weekIndex) {
    setForm((current) => ({ ...current, microciclos: current.microciclos.filter((_, index) => index !== weekIndex).map((week, index) => ({ ...week, numero_semana: index + 1 })) }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!form.microciclos.length || form.microciclos.some((week) => !week.dias_entrenamiento.length)) {
      setError('Cada semana debe tener al menos un día de entrenamiento.')
      return
    }
    const minimumStart = isEditing ? '' : futureInput()
    if (!form.id_cliente || !form.nombre.trim() || !form.objetivo.trim() || !form.fecha_inicio || !form.fecha_termino || (!isEditing && form.fecha_inicio < minimumStart) || form.fecha_termino < form.fecha_inicio) {
      setError(isEditing ? 'Completa los datos del plan y verifica que el rango de fechas sea válido.' : 'Completa los datos del plan. Las fechas de una nueva planificación deben ser futuras.')
      return
    }
    if (form.microciclos.some((week) => week.dias_entrenamiento.some((day) => !day.fecha || (!isEditing && day.fecha < futureInput()) || day.fecha < form.fecha_inicio || day.fecha > form.fecha_termino))) {
      setError(isEditing ? 'Cada día debe quedar dentro del rango de fechas del plan.' : 'Cada día debe quedar dentro del rango del plan y no puede estar en el pasado.')
      return
    }
    if (form.microciclos.some((week) => week.dias_entrenamiento.some((day) => !day.ejercicios.length || day.ejercicios.some((exercise) => !exercise.id_ejercicio)))) {
      setError('Agrega al menos un ejercicio válido a cada día.')
      return
    }
    if (form.microciclos.some((week) => week.dias_entrenamiento.some((day) => day.ejercicios.some((exercise) => exercise.tipo_objetivo === 'tiempo' && Number(exercise.tiempo_segundos) < 1)))) {
      setError('Los ejercicios por tiempo deben tener una duración de al menos 1 segundo.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        microciclos: form.microciclos.map((week, weekIndex) => ({
          numero_semana: weekIndex + 1,
          dias_entrenamiento: week.dias_entrenamiento.map((day) => ({
            fecha: new Date(`${day.fecha}T12:00:00`).toISOString(),
            finalizado: day.finalizado,
            ejercicios: day.ejercicios.map(({ id_ejercicio, series_planificadas, peso_planificado, tipo_objetivo, repeticiones_planificadas, tiempo_segundos, historial_rendimiento }) => ({ id_ejercicio, series_planificadas: Number(series_planificadas), peso_planificado: peso_planificado === '' || peso_planificado == null ? null : Number(peso_planificado), tipo_objetivo, repeticiones_planificadas: tipo_objetivo === 'repeticiones' ? repeticiones_planificadas : undefined, tiempo_segundos: tipo_objetivo === 'tiempo' ? Number(tiempo_segundos) : undefined, historial_rendimiento })),
          })),
        })),
      }
      if (isEditing) {
        await updatePlanning(editingPlanningId, payload)
        setNotice('Planificación actualizada. Los cambios ya están guardados.')
      } else {
        await createPlanning(payload)
        setNotice('Planificación creada y asignada al cliente.')
      }
      await refreshPlannings()
      setEditorOpen(false)
      setEditingPlanningId(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo guardar la planificación.')
    } finally {
      setSaving(false)
    }
  }

  async function removePlanning(planning, clientName) {
    const confirmed = window.confirm(`¿Eliminar la planificación "${planning.nombre}" de ${clientName}? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setError('')
    setNotice('')
    setDeletingPlanningId(planning._id)
    try {
      await deletePlanning(planning._id)
      setPlannings((current) => current.filter((item) => item._id !== planning._id))
      setNotice(`La planificación "${planning.nombre}" fue eliminada.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo eliminar la planificación.')
    } finally {
      setDeletingPlanningId(null)
    }
  }

  if (loading) return <section className="admin-page"><div className="admin-page-heading"><div><div className="admin-kicker">ENTRENAMIENTO</div><h1>Planificación.</h1></div></div><div className="admin-state">Cargando planificaciones…</div></section>

  return <section className="admin-page">
    <div className="admin-page-heading"><div><div className="admin-kicker">ORGANIZA EL ENTRENAMIENTO</div><h1>Planificaciones<em>.</em></h1><p>Consulta las rutinas existentes o crea y edita un plan desde un solo lugar.</p></div>{!editorOpen && <button className="button button-primary admin-action" type="button" onClick={openNewPlanning}><Plus size={16} />Nueva planificación</button>}</div>
    {error && <p className="admin-alert" role="alert">{error}</p>}
    {notice && <p className="admin-notice" role="status">{notice}</p>}

    {editorOpen ? <>
      <button className="planning-back-button" type="button" onClick={closeEditor}><ArrowLeft size={15} />Volver a planificaciones</button>
      <form className="planning-editor" onSubmit={submit}>
        <section className="planning-editor-section">
          <div className="planning-editor-section-heading"><span>1</span><div><h2>{isEditing ? 'Edita los datos del plan' : 'Datos del plan'}</h2><p>Elige el cliente y define el objetivo y la duración.</p></div></div>
          <div className="planning-editor-fields">
            <label>Cliente<select required value={form.id_cliente} onChange={(event) => setForm({ ...form, id_cliente: event.target.value })}><option value="">Selecciona un cliente</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.nombre} · {client.email}</option>)}</select></label>
            <label>Nombre del plan<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required placeholder="Ej. Fuerza · Fase 1" /></label>
            <label>Objetivo<input value={form.objetivo} onChange={(event) => setForm({ ...form, objetivo: event.target.value })} required placeholder="Ej. Aumento de fuerza" /></label>
            <label>Desde<input type="date" min={isEditing ? undefined : futureInput()} value={form.fecha_inicio} onChange={(event) => setForm({ ...form, fecha_inicio: event.target.value })} required /></label>
            <label>Hasta<input type="date" min={form.fecha_inicio || (isEditing ? undefined : futureInput())} value={form.fecha_termino} onChange={(event) => setForm({ ...form, fecha_termino: event.target.value })} required /></label>
          </div>
        </section>

        <section className="planning-editor-section">
          <div className="planning-editor-section-heading"><span>2</span><div><h2>Organiza semanas y días</h2><p>Agrega días al calendario y luego arma cada rutina con ejercicios.</p></div></div>
          {exercises.length > 0 && <div className="planning-editor-catalog"><label><Search size={15} /><input aria-label="Buscar ejercicio" value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value)} placeholder="Buscar ejercicio" /></label><select aria-label="Filtrar ejercicios por categoría" value={exerciseCategory} onChange={(event) => setExerciseCategory(event.target.value)}><option value="">Todas las categorías</option>{exerciseCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select><span>{visibleExercises.length} ejercicios</span></div>}
          {!exercises.length && <p className="admin-alert">Primero agrega ejercicios al catálogo.</p>}
          <div className="planning-editor-weeks">{form.microciclos.map((week, weekIndex) => <article className="planning-editor-week" key={`week-${weekIndex}`}>
            <header><div><span>SEMANA {weekIndex + 1}</span><strong>{week.dias_entrenamiento.length} {week.dias_entrenamiento.length === 1 ? 'día' : 'días'}</strong></div><button className="planning-editor-icon-button is-danger" type="button" aria-label={`Eliminar semana ${weekIndex + 1}`} disabled={form.microciclos.length === 1} onClick={() => removeWeek(weekIndex)}><Trash2 size={15} /></button></header>
            <div className="planning-editor-days">{week.dias_entrenamiento.map((day, dayIndex) => <section className="planning-editor-day" key={`week-${weekIndex}-day-${dayIndex}`}>
              <div className="planning-editor-day-top"><div><CalendarDays size={15} /><strong>{displayDate(day.fecha)}</strong><span>{day.ejercicios.length} {day.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}</span></div><button className="planning-editor-icon-button is-danger" type="button" aria-label="Eliminar día" onClick={() => updateWeek(weekIndex, (current) => ({ ...current, dias_entrenamiento: current.dias_entrenamiento.filter((_, index) => index !== dayIndex) }))}><X size={15} /></button></div>
              <label className="planning-editor-date">Fecha<input type="date" min={isEditing && day.fecha < todayInput() ? day.fecha : isEditing ? todayInput() : futureInput()} max={form.fecha_termino || undefined} value={day.fecha} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, fecha: event.target.value }))} required /></label>
              <div className="planning-editor-exercises">{day.ejercicios.map((exercise, exerciseIndex) => <div className="planning-editor-exercise" key={`exercise-${exerciseIndex}`}>
                <div className="planning-editor-exercise-heading">
                  <span className="planning-editor-exercise-number">{String(exerciseIndex + 1).padStart(2, '0')}</span>
                  <label className="planning-exercise-field"><span>Ejercicio</span><select className="planning-exercise-select" required value={exercise.id_ejercicio} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, id_ejercicio: event.target.value, historial_rendimiento: item.id_ejercicio === event.target.value ? item.historial_rendimiento : [] } : item) }))}><option value="">Selecciona ejercicio</option>{exercises.filter((item) => visibleExercises.some((visible) => visible._id === item._id) || item._id === exercise.id_ejercicio).map((item) => <option key={item._id} value={item._id}>{item.nombre} · {item.categoria}</option>)}</select></label>
                  <button className="planning-editor-icon-button is-danger" type="button" aria-label="Quitar ejercicio" onClick={() => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.filter((_, index) => index !== exerciseIndex) }))}><Trash2 size={14} /></button>
                </div>
                <div className="planning-editor-exercise-fields">
                  <label className="planning-series-field"><span>Series</span><input aria-label="Series" type="number" min="1" max="20" value={exercise.series_planificadas} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, series_planificadas: event.target.value } : item) }))} /></label>
                  <label className="planning-goal-type-field"><span>Tipo</span><select className="planning-goal-type" value={exercise.tipo_objetivo} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, tipo_objetivo: event.target.value } : item) }))}><option value="repeticiones">Repeticiones</option><option value="tiempo">Tiempo</option></select></label>
                  <label className="planning-goal-value"><span>{exercise.tipo_objetivo === 'tiempo' ? 'Segundos' : 'Repeticiones'}</span><input aria-label={exercise.tipo_objetivo === 'tiempo' ? 'Duración en segundos' : 'Repeticiones'} type={exercise.tipo_objetivo === 'tiempo' ? 'number' : 'text'} min={exercise.tipo_objetivo === 'tiempo' ? '1' : undefined} value={exercise.tipo_objetivo === 'tiempo' ? exercise.tiempo_segundos : exercise.repeticiones_planificadas} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? exercise.tipo_objetivo === 'tiempo' ? { ...item, tiempo_segundos: event.target.value } : { ...item, repeticiones_planificadas: event.target.value } : item) }))} placeholder={exercise.tipo_objetivo === 'tiempo' ? '30' : '8-12'} required /></label>
                  <label className="planning-weight-field"><span>Peso (kg) · opcional</span><input aria-label="Peso planificado en kilogramos" type="number" min="0.1" step="any" value={exercise.peso_planificado ?? ''} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, peso_planificado: event.target.value } : item) }))} placeholder="Sin peso" /></label>
                </div>
              </div>)}
                {!day.ejercicios.length && <p className="planning-editor-empty">Todavía no agregas ejercicios a este día.</p>}
                <button className="planning-editor-add-exercise" type="button" disabled={!visibleExercises.length} onClick={() => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: [...current.ejercicios, { id_ejercicio: '', series_planificadas: 3, peso_planificado: '', tipo_objetivo: 'repeticiones', repeticiones_planificadas: '8-12', tiempo_segundos: 30, historial_rendimiento: [] }] }))}><Plus size={14} />Añadir ejercicio</button>
              </div>
            </section>)}</div>
            <button className="planning-editor-add-day" type="button" onClick={() => addDay(weekIndex)}><CalendarPlus size={15} />Añadir día a semana {weekIndex + 1}</button>
          </article>)}</div>
          <button className="planning-editor-add-week" type="button" onClick={() => addWeek(false)}><Plus size={15} />Semana vacía</button>
          {form.microciclos.length > 0 && <button className="planning-editor-copy-week" type="button" onClick={() => addWeek(true)}><Copy size={14} />Duplicar semana anterior</button>}
        </section>

        <div className="planning-editor-footer"><button className="button button-outline" type="button" onClick={closeEditor}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving || !clients.length || !exercises.length}>{saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear planificación'}<Check size={15} /></button></div>
      </form>
    </> : <>
      <section className="planning-library-toolbar"><div><strong>{visiblePlannings.length}</strong><span>{visiblePlannings.length === 1 ? ' planificación' : ' planificaciones'}</span></div><label><UsersRound size={15} /><select aria-label="Filtrar planificaciones por cliente" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option value="">Todos los clientes</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.nombre}</option>)}</select></label></section>
      {visiblePlannings.length === 0 ? <div className="admin-empty"><CalendarDays size={22} /><strong>{clientFilter ? 'Este cliente aún no tiene planes' : 'Aún no hay planificaciones'}</strong><p>Comienza una planificación y aquí verás sus semanas, días y ejercicios.</p>{!clients.length && <p>Crea un cliente antes de asignarle una rutina.</p>}</div> : <div className="planning-library">{visiblePlannings.map((planning) => {
        const clientId = planning.id_cliente?._id || planning.id_cliente
        const clientName = clients.find((client) => client._id === clientId)?.nombre || planning.id_cliente?.nombre || 'Cliente'
        const days = (planning.microciclos || []).flatMap((week) => week.dias_entrenamiento || [])
        const exerciseCount = days.reduce((total, day) => total + (day.ejercicios?.length || 0), 0)
        return <article className="planning-library-card" key={planning._id}>
          <div className="planning-library-card-heading"><div><span><UsersRound size={13} />{clientName}</span><h2>{planning.nombre}</h2><p><Target size={13} />{planning.objetivo}</p></div><div className="planning-library-actions"><button className="button button-outline" type="button" onClick={() => openEditPlanning(planning)}><Edit3 size={14} />Editar plan</button><button className="admin-icon-danger planning-delete-button" type="button" aria-label={`Eliminar planificación ${planning.nombre}`} title="Eliminar planificación" disabled={deletingPlanningId === planning._id} onClick={() => removePlanning(planning, clientName)}><Trash2 size={15} /></button></div></div>
          <div className="planning-library-summary"><span>{planning.microciclos?.length || 0} semanas</span><span>{days.length} días</span><span>{exerciseCount} ejercicios</span><span>{displayDate(planning.fecha_inicio, { day: 'numeric', month: 'short', year: 'numeric' })} – {displayDate(planning.fecha_termino, { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          <div className="planning-library-weeks">{(planning.microciclos || []).map((week, weekIndex) => <details className="planning-library-week" key={`${planning._id}-week-${weekIndex}`}><summary><span>Semana {week.numero_semana}</span><small>{week.dias_entrenamiento?.length || 0} días</small></summary><div className="planning-library-week-days">{(week.dias_entrenamiento || []).map((day, dayIndex) => <details className="planning-library-day-details" key={`${planning._id}-${weekIndex}-${dayIndex}`}><summary className="planning-library-day"><span className={`planning-library-day-icon${day.ejercicios?.length ? ' has-exercises' : ''}`}>{day.finalizado ? <Check size={13} /> : <CalendarDays size={13} />}</span><span className="planning-library-day-main"><strong>{displayDate(day.fecha)}</strong><small>{day.finalizado ? 'Completado' : `${day.ejercicios?.length || 0} ejercicios`}</small></span><span className="planning-library-day-chevron">⌄</span></summary><div className="planning-library-day-content"><ul>{(day.ejercicios || []).map((exercise, exerciseIndex) => <li key={`${day._id}-${exerciseIndex}`}>{exercise.id_ejercicio?.nombre || 'Ejercicio'}{exercise.peso_planificado != null ? ` · ${Number(exercise.peso_planificado).toLocaleString('es-CL')} kg` : ''}</li>)}</ul>{planning.dias_con_encuesta?.includes(String(day._id)) && <button className="button button-outline planning-survey-day-button" type="button" onClick={() => { setSurveyModalPlanning(planning); setSurveyModalDay({ ...day, numero_semana: week.numero_semana }) }}><ClipboardList size={12} />Ver respuestas del día</button>}</div></details>)}</div></details>)}</div>
        </article>
      })}</div>}
    </>}
    {surveyModalPlanning && surveyModalDay && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSurveyModalPlanning(null); setSurveyModalDay(null) } }}>
      <section className="admin-modal planning-survey-modal" role="dialog" aria-modal="true" aria-labelledby="planning-survey-title">
        <header className="planning-survey-modal-header"><div><div className="admin-kicker">SEGUIMIENTO DEL CLIENTE</div><h2 id="planning-survey-title">Respuestas del día</h2><p>{surveyModalPlanning.nombre} · {displayDate(surveyModalDay.fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Semana {surveyModalDay.numero_semana}</p></div><button className="admin-icon-danger" type="button" aria-label="Cerrar respuestas" onClick={() => { setSurveyModalPlanning(null); setSurveyModalDay(null) }}><X size={18} /></button></header>
        <div className="planning-survey-modal-content">
          {loadingPlanningSurveys ? <div className="admin-state">Cargando respuestas…</div>
            : planningSurveyError ? <p className="admin-alert" role="alert">{planningSurveyError}</p>
              : planningSurveys.length === 0 ? <div className="admin-empty"><ClipboardList size={22} /><strong>Aún no hay respuestas</strong><p>Las encuestas aparecerán aquí cuando el cliente cierre una sesión y envíe sus respuestas.</p></div>
                : <div className="planning-survey-list">{planningSurveys.map((survey) => <article className="planning-survey-card" key={survey._id}>
                  <header><div><strong>{survey.id_cliente?.nombre || 'Cliente'}</strong><span>{survey.id_cliente?.email || ''}</span></div><div className="planning-survey-date">{survey.dia_entrenamiento?.fecha ? displayDate(survey.dia_entrenamiento.fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Día de entrenamiento'}{survey.dia_entrenamiento?.numero_semana ? ` · Semana ${survey.dia_entrenamiento.numero_semana}` : ''}</div></header>
                  <div className="planning-survey-answers"><div><span>Exigencia</span><strong>{['', 'Muy baja', 'Baja', 'Moderada', 'Alta', 'Muy alta'][survey.nivel_exigencia] || `${survey.nivel_exigencia}/5`} <small>({survey.nivel_exigencia}/5)</small></strong></div><div><span>¿Tuvo molestias?</span><strong>{survey.tuvo_molestia ? 'Sí' : 'No'}</strong></div></div>
                  {survey.tuvo_molestia && <div className="planning-survey-note"><span>Detalle de la molestia</span><p>{survey.detalle_molestia || 'No dejó detalles.'}</p></div>}
                  <div className="planning-survey-note"><span>Comentarios adicionales</span><p>{survey.comentarios_adicionales || 'Sin comentarios adicionales.'}</p></div>
                </article>)}</div>}
        </div>
        <footer className="planning-survey-modal-footer"><span>{planningSurveys.length} {planningSurveys.length === 1 ? 'respuesta' : 'respuestas'}</span><button className="button button-primary" type="button" onClick={() => { setSurveyModalPlanning(null); setSurveyModalDay(null) }}>Cerrar</button></footer>
      </section>
    </div>}
  </section>
}
