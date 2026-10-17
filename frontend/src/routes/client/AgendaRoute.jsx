import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Dumbbell, RotateCw } from 'lucide-react'
import { getPlannings } from '../../services/plannings.service'

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function localDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function weekStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

function exerciseName(exercise) {
  const data = exercise.id_ejercicio
  return typeof data === 'object' && data !== null ? data.nombre : 'Ejercicio'
}

function plannedGoal(exercise) {
  if (exercise.tipo_objetivo !== 'tiempo') return `${exercise.repeticiones_planificadas || 'Repeticiones según indicación'} rep.`
  const seconds = Number(exercise.tiempo_segundos)
  if (!Number.isFinite(seconds) || seconds < 1) return 'Tiempo según indicación'
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} s` : ''}` : `${seconds} s`
}

export default function AgendaRoute({ onOpenRoutine }) {
  const [plannings, setPlannings] = useState([])
  const [week, setWeek] = useState(() => weekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPlannings()
      .then((response) => { if (active) setPlannings(response.plannings || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudo cargar tu agenda.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(week)
    date.setDate(date.getDate() + index)
    return date
  }), [week])

  const sessionsForDay = useMemo(() => {
    const sessions = []
    for (const planning of plannings) {
      for (const [microcycleIndex, microcycle] of (planning.microciclos || []).entries()) {
        for (const [dayIndex, day] of (microcycle.dias_entrenamiento || []).entries()) {
          if (dateKey(localDate(day.fecha)) === selectedDate) {
            sessions.push({ planning, day, weekNumber: microcycle.numero_semana, microcycleIndex, dayIndex })
          }
        }
      }
    }
    return sessions
  }, [plannings, selectedDate])

  const selected = localDate(selectedDate)
  const monthLabel = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(week)
  const fullDate = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(selected)

  function moveWeek(amount) {
    setWeek((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + amount * 7)
      return next
    })
    setSelectedDate((current) => {
      const next = localDate(current)
      next.setDate(next.getDate() + amount * 7)
      return dateKey(next)
    })
  }

  return (
    <section className="client-page">
      <div className="client-page-heading"><div><div className="client-kicker">TU SEMANA DE ENTRENAMIENTO</div><h1>Agenda <em>semanal.</em></h1><p>Revisa tus sesiones y ejercicios planificados.</p></div><button className="client-icon-button" title="Volver a esta semana" onClick={() => { const today = new Date(); setWeek(weekStart(today)); setSelectedDate(dateKey(today)) }}><RotateCw size={17} /></button></div>
      <div className="week-toolbar"><button className="client-icon-button" aria-label="Semana anterior" onClick={() => moveWeek(-1)}><ArrowLeft size={17} /></button><div className="week-label">{monthLabel}</div><button className="client-icon-button" aria-label="Semana siguiente" onClick={() => moveWeek(1)}><ArrowRight size={17} /></button></div>
      <div className="week-days" role="group" aria-label="Días de la semana">{days.map((day, index) => {
        const key = dateKey(day)
        const hasWorkout = plannings.some((planning) => (planning.microciclos || []).some((cycle) => (cycle.dias_entrenamiento || []).some((trainingDay) => dateKey(localDate(trainingDay.fecha)) === key)))
        return <button key={key} className={`week-day${selectedDate === key ? ' is-selected' : ''}`} onClick={() => setSelectedDate(key)}><span>{weekdays[index]}</span><strong>{day.getDate()}</strong><i className={hasWorkout ? 'has-workout' : ''} /></button>
      })}</div>
      <div className="agenda-day-heading"><div><span>SESIONES DEL DÍA</span><h2>{fullDate}</h2></div></div>
      {loading && <div className="client-state">Cargando tu agenda…</div>}
      {error && <div className="client-state client-error">{error}</div>}
      {!loading && !error && sessionsForDay.length === 0 && <div className="agenda-empty"><div className="client-icon-badge"><Dumbbell size={19} /></div><strong>Sin entrenamientos para este día</strong><p>Desplázate por la semana para revisar tus próximas sesiones.</p></div>}
      {!loading && sessionsForDay.map(({ planning, day, weekNumber, microcycleIndex, dayIndex }) => {
        const openRoutine = () => onOpenRoutine?.({ planningId: planning._id, microcycleIndex, dayIndex })
        return <article className="agenda-session" key={`${planning._id}-${microcycleIndex}-${dayIndex}`}>
          <button className="agenda-session-open" onClick={openRoutine} aria-label={`Abrir ${planning.nombre}, semana ${weekNumber}`}>
            <div className="agenda-session-top"><div><span className="client-kicker">SEMANA {weekNumber}</span><h3>{planning.nombre}</h3><p>{planning.objetivo}</p></div><span className={`session-status${day.finalizado ? ' is-complete' : ''}`}>{day.finalizado ? <><Check size={13} /> Completado</> : 'Planificado'}</span></div>
          </button>
          <div className="agenda-exercises">{(day.ejercicios || []).map((exercise, index) => <button className="agenda-exercise" key={`${exercise.id_ejercicio?._id || index}-${index}`} onClick={openRoutine} aria-label={`Ver rutina: ${exerciseName(exercise)}`}><span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{exerciseName(exercise)}</strong><small>{exercise.series_planificadas || '—'} series · {plannedGoal(exercise)}</small></div><span className="agenda-exercise-hint">Ver rutina ↗</span></button>)}</div>
        </article>
      })}
    </section>
  )
}
