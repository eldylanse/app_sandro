import { useEffect, useState } from 'react'
import { CalendarPlus, Dumbbell, Plus, Target, Trash2, X } from 'lucide-react'
import { getExercises } from '../../services/exercises.service'
import { createPlanning } from '../../services/plannings.service'
import { getClients } from '../../services/users.service'

function futureInput() {
  const future = new Date()
  future.setDate(future.getDate() + 1)
  return `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`
}

function newDay(date = futureInput()) {
  return { fecha: date, ejercicios: [] }
}

function clampDate(date, minimum, maximum) {
  if (date < minimum) return minimum
  if (maximum && date > maximum) return maximum
  return date
}

export default function PlanningRoute() {
  const [clients, setClients] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ id_cliente: '', nombre: '', objetivo: '', fecha_inicio: futureInput(), fecha_termino: '', microciclos: [{ numero_semana: 1, dias_entrenamiento: [newDay()] }] })

  useEffect(() => {
    let active = true
    Promise.all([getClients(), getExercises()])
      .then(([clientList, exerciseResponse]) => {
        if (!active) return
        setClients(clientList || [])
        setExercises(exerciseResponse.exercises || [])
        if (clientList?.length) setForm((current) => ({ ...current, id_cliente: clientList[0]._id }))
      })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar clientes y ejercicios.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function updateWeek(weekIndex, transform) {
    setForm((current) => ({ ...current, microciclos: current.microciclos.map((week, index) => index === weekIndex ? transform(week) : week) }))
  }

  function updateDay(weekIndex, dayIndex, transform) {
    updateWeek(weekIndex, (week) => ({ ...week, dias_entrenamiento: week.dias_entrenamiento.map((day, index) => index === dayIndex ? transform(day) : day) }))
  }

  function updatePlanDate(field, value) {
    const minimumDate = futureInput()
    setForm((current) => {
      const nextStart = field === 'fecha_inicio' ? value : current.fecha_inicio
      const nextEnd = field === 'fecha_termino' ? value : field === 'fecha_inicio' && current.fecha_termino && current.fecha_termino < value ? value : current.fecha_termino
      const minimum = nextStart > minimumDate ? nextStart : minimumDate
      return {
        ...current,
        [field]: value,
        ...(field === 'fecha_inicio' && current.fecha_termino !== nextEnd ? { fecha_termino: nextEnd } : {}),
        microciclos: current.microciclos.map((week) => ({
          ...week,
          dias_entrenamiento: week.dias_entrenamiento.map((day) => ({ ...day, fecha: clampDate(day.fecha, minimum, nextEnd) })),
        })),
      }
    })
  }

  function addWeek() {
    setForm((current) => ({ ...current, microciclos: [...current.microciclos, { numero_semana: current.microciclos.length + 1, dias_entrenamiento: [] }] }))
  }

  function removeWeek(weekIndex) {
    setForm((current) => ({ ...current, microciclos: current.microciclos.filter((_, index) => index !== weekIndex).map((week, index) => ({ ...week, numero_semana: index + 1 })) }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!form.microciclos.length || form.microciclos.some((week) => !week.dias_entrenamiento.length)) {
      setError('Agrega al menos un día de entrenamiento en cada semana.')
      return
    }
    const minimumDate = futureInput()
    if (!form.fecha_inicio || !form.fecha_termino || form.fecha_inicio < minimumDate || form.fecha_termino < form.fecha_inicio) {
      setError('Selecciona un rango válido: las fechas deben ser futuras y el término no puede ser anterior al inicio.')
      return
    }
    const minimumTrainingDate = form.fecha_inicio > minimumDate ? form.fecha_inicio : minimumDate
    if (form.microciclos.some((week) => week.dias_entrenamiento.some((day) => !day.fecha || day.fecha < minimumTrainingDate || day.fecha > form.fecha_termino))) {
      setError('Cada día de entrenamiento debe quedar dentro del rango del plan y no puede estar en el pasado.')
      return
    }
    if (form.microciclos.some((week) => week.dias_entrenamiento.some((day) => !day.ejercicios.length || day.ejercicios.some((exercise) => !exercise.id_ejercicio)))) {
      setError('Cada día debe incluir al menos un ejercicio seleccionado.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        microciclos: form.microciclos.map((week) => ({
          numero_semana: week.numero_semana,
          dias_entrenamiento: week.dias_entrenamiento.map((day) => ({
            fecha: new Date(`${day.fecha}T12:00:00`).toISOString(),
            ejercicios: day.ejercicios.map(({ id_ejercicio, series_planificadas, repeticiones_planificadas }) => ({ id_ejercicio, series_planificadas: Number(series_planificadas), repeticiones_planificadas })),
          })),
        })),
      }
      await createPlanning(payload)
      setNotice('Planificación creada y asignada al cliente.')
      setForm((current) => ({ ...current, nombre: '', objetivo: '', fecha_inicio: futureInput(), fecha_termino: '', microciclos: [{ numero_semana: 1, dias_entrenamiento: [newDay()] }] }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo crear la planificación.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="admin-page">
    <div className="admin-page-heading"><div><div className="admin-kicker">DISEÑO DE ENTRENAMIENTO</div><h1>Nueva <em>planificación.</em></h1><p>Asigna un plan, define sus semanas y distribuye los ejercicios.</p></div><span className="admin-heading-symbol"><CalendarPlus size={24} /></span></div>
    {error && <p className="admin-alert" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    {loading && <div className="admin-state">Cargando clientes y ejercicios…</div>}
    {!loading && <form className="planning-form" onSubmit={submit}>
      <section className="planning-section"><div className="planning-section-heading"><span>01</span><div><h2>Datos del plan</h2><p>Define a quién se asigna y cuál es el objetivo.</p></div></div><div className="admin-form-grid"><label className="admin-field-wide">Cliente<select required value={form.id_cliente} onChange={(event) => setForm({ ...form, id_cliente: event.target.value })}><option value="" disabled>Selecciona un cliente</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.nombre} · {client.email}</option>)}</select></label><label>Nombre de la planificación<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required placeholder="Ej. Hipertrofia · Fase 1" /></label><label>Objetivo<input value={form.objetivo} onChange={(event) => setForm({ ...form, objetivo: event.target.value })} required placeholder="Ej. Ganancia muscular" /></label><label>Fecha de inicio<input type="date" min={futureInput()} value={form.fecha_inicio} onChange={(event) => updatePlanDate('fecha_inicio', event.target.value)} required /></label><label>Fecha de término<input type="date" min={form.fecha_inicio > futureInput() ? form.fecha_inicio : futureInput()} value={form.fecha_termino} onChange={(event) => updatePlanDate('fecha_termino', event.target.value)} required /></label></div><p className="planning-date-hint">El inicio y el término deben ser fechas futuras. Los días de entrenamiento quedarán limitados a este rango.</p></section>
      <section className="planning-section"><div className="planning-section-heading"><span>02</span><div><h2>Estructura semanal</h2><p>Programa uno o más días y selecciona sus ejercicios.</p></div><button type="button" className="button button-outline" onClick={addWeek}><Plus size={15} />Agregar semana</button></div>
        {!clients.length && <p className="admin-alert">Debes crear un cliente antes de asignar una planificación.</p>}{!exercises.length && <p className="admin-alert">Agrega ejercicios al catálogo antes de armar la rutina.</p>}{Boolean(exercises.length) && <p className="planning-date-hint">Añade una fila de ejercicio y selecciónalo desde el catálogo cargado.</p>}
        <div className="planning-weeks">{form.microciclos.map((week, weekIndex) => <article className="planning-week" key={`week-${weekIndex}`}><div className="planning-week-heading"><strong>Semana {week.numero_semana}</strong><button type="button" className="planning-remove" disabled={form.microciclos.length === 1} onClick={() => removeWeek(weekIndex)} aria-label={`Eliminar semana ${week.numero_semana}`}><Trash2 size={14} /></button></div>
          {week.dias_entrenamiento.map((day, dayIndex) => <div className="planning-day" key={`week-${weekIndex}-day-${dayIndex}`}><div className="planning-day-heading"><label>Fecha de entrenamiento<input type="date" min={form.fecha_inicio > futureInput() ? form.fecha_inicio : futureInput()} max={form.fecha_termino || undefined} value={day.fecha} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, fecha: clampDate(event.target.value, form.fecha_inicio > futureInput() ? form.fecha_inicio : futureInput(), form.fecha_termino) }))} required /></label><button type="button" className="planning-remove" onClick={() => updateWeek(weekIndex, (current) => ({ ...current, dias_entrenamiento: current.dias_entrenamiento.filter((_, index) => index !== dayIndex) }))} aria-label="Eliminar día"><Trash2 size={14} /></button></div>
            <div className="planning-day-exercises">{day.ejercicios.map((exercise, exerciseIndex) => <div className="planning-exercise-row" key={`exercise-${exerciseIndex}`}><select aria-label="Ejercicio" required value={exercise.id_ejercicio} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, id_ejercicio: event.target.value } : item) }))}><option value="" disabled>Selecciona ejercicio</option>{exercises.map((item) => <option key={item._id} value={item._id}>{item.nombre} · {item.categoria}</option>)}</select><input aria-label="Series" type="number" min="1" max="20" value={exercise.series_planificadas} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, series_planificadas: event.target.value } : item) }))} placeholder="Series" /><input aria-label="Repeticiones" value={exercise.repeticiones_planificadas} onChange={(event) => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.map((item, index) => index === exerciseIndex ? { ...item, repeticiones_planificadas: event.target.value } : item) }))} placeholder="8-12 reps" /><button type="button" className="planning-remove" onClick={() => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: current.ejercicios.filter((_, index) => index !== exerciseIndex) }))} aria-label="Quitar ejercicio"><X size={14} /></button></div>)}
              <button type="button" className="planning-add-inline" onClick={() => updateDay(weekIndex, dayIndex, (current) => ({ ...current, ejercicios: [...current.ejercicios, { id_ejercicio: '', series_planificadas: 3, repeticiones_planificadas: '8-12' }] }))}><Plus size={14} />Añadir ejercicio del catálogo</button>
            </div>
          </div>)}
          <button type="button" className="planning-add-day" disabled={!form.fecha_termino} onClick={() => updateWeek(weekIndex, (current) => ({ ...current, dias_entrenamiento: [...current.dias_entrenamiento, newDay(clampDate(futureInput(), form.fecha_inicio > futureInput() ? form.fecha_inicio : futureInput(), form.fecha_termino))] }))}><CalendarPlus size={14} />Añadir día de entrenamiento</button>
        </article>)}</div>
      </section>
      <div className="planning-submit-row"><span><Target size={15} /> La planificación será visible en la agenda del cliente.</span><button className="button button-primary" disabled={saving || !clients.length || !exercises.length}>{saving ? 'Creando planificación…' : 'Crear planificación'} <Dumbbell size={15} /></button></div>
    </form>}
  </section>
}
