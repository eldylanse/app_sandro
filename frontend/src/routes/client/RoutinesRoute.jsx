import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, Dumbbell, Play, RotateCcw, Target } from 'lucide-react'
import { getPlannings, updateTrainingDayStatus } from '../../services/plannings.service'

function shortDate(value) {
  if (!value) return 'Fecha pendiente'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha pendiente' : new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function localDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

function youtubeEmbedUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoId = ''
    if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] || ''
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v') || ''
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) videoId = url.pathname.split('/')[2] || ''
    }
    return /^[\w-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : null
  } catch {
    return null
  }
}

export default function RoutinesRoute({ onBackToAgenda }) {
  const [plannings, setPlannings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const params = new URLSearchParams(window.location.search)
  const selectedPlanningId = params.get('planning')
  const selectedCycleIndex = Number(params.get('cycle'))
  const selectedDayIndex = Number(params.get('day'))

  useEffect(() => {
    let active = true
    getPlannings()
      .then((response) => { if (active) setPlannings(response.plannings || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar tus rutinas.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const selectedPlanning = useMemo(() => plannings.find((planning) => planning._id === selectedPlanningId), [plannings, selectedPlanningId])
  const selectedCycle = Number.isInteger(selectedCycleIndex) ? selectedPlanning?.microciclos?.[selectedCycleIndex] : null
  const selectedDay = Number.isInteger(selectedDayIndex) ? selectedCycle?.dias_entrenamiento?.[selectedDayIndex] : null
  const selectedDate = selectedDay?.fecha ? new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(localDate(selectedDay.fecha)) : ''

  async function toggleDayStatus() {
    if (!selectedPlanning || !selectedDay || savingStatus) return
    setSavingStatus(true)
    setError('')
    const finalizado = !selectedDay.finalizado
    try {
      await updateTrainingDayStatus(selectedPlanning._id, { microcicloIndex: selectedCycleIndex, diaIndex: selectedDayIndex, finalizado })
      setPlannings((current) => current.map((planning) => planning._id !== selectedPlanning._id ? planning : {
        ...planning,
        microciclos: planning.microciclos.map((cycle, cycleIndex) => cycleIndex !== selectedCycleIndex ? cycle : {
          ...cycle,
          dias_entrenamiento: cycle.dias_entrenamiento.map((day, dayIndex) => dayIndex !== selectedDayIndex ? day : { ...day, finalizado }),
        }),
      }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo actualizar el estado de la sesión.')
    } finally {
      setSavingStatus(false)
    }
  }

  return <section className="client-page">
    <div className="client-page-heading"><div><div className="client-kicker">DISEÑADAS PARA TI</div><h1>Mis <em>rutinas.</em></h1><p>Ejercicios de tu planificación, en el orden indicado por tu preparador.</p></div></div>
    {loading && <div className="client-state">Cargando tus rutinas…</div>}
    {error && <div className="client-state client-error">{error}</div>}
    {!loading && !error && selectedPlanning && selectedDay && <>
      <button type="button" className="routine-back-link" onClick={onBackToAgenda}> <ArrowLeft size={16} /> Volver a la agenda</button>
      <header className="routine-day-header"><div className="routine-icon"><Dumbbell size={19} /></div><div><span>SEMANA {selectedCycle.numero_semana} · {selectedDate}</span><h2>{selectedPlanning.nombre}</h2><p><Target size={15} /> {selectedPlanning.objetivo}</p></div><span className={`session-status${selectedDay.finalizado ? ' is-complete' : ''}`}>{selectedDay.finalizado ? 'Completado' : 'Planificado'}</span><button className="routine-completion-button" type="button" onClick={toggleDayStatus} disabled={savingStatus}>{selectedDay.finalizado ? <RotateCcw size={15} /> : <Check size={15} />}{savingStatus ? 'Guardando…' : selectedDay.finalizado ? 'Deshacer' : 'Marcar completado'}</button></header>
      <div className="routine-exercise-list">{(selectedDay.ejercicios || []).map((plannedExercise, index) => {
        const exercise = plannedExercise.id_ejercicio && typeof plannedExercise.id_ejercicio === 'object' ? plannedExercise.id_ejercicio : {}
        const embedUrl = youtubeEmbedUrl(exercise.url_video)
        return <article className="routine-exercise-card" key={`${exercise._id || index}-${index}`}>
          <div className="routine-exercise-info"><div className="routine-exercise-number">{String(index + 1).padStart(2, '0')}</div><div className="routine-exercise-title"><span>{exercise.categoria || 'EJERCICIO'}</span><h3>{exercise.nombre || 'Ejercicio'}</h3><p>{exercise.descripcion || 'Sigue las indicaciones de tu preparador y mantén una técnica controlada.'}</p></div></div>
          <div className="routine-exercise-metrics"><div><span>SERIES</span><strong>{plannedExercise.series_planificadas || '—'}</strong></div><div><span>REPETICIONES</span><strong>{plannedExercise.repeticiones_planificadas || 'Según indicación'}</strong></div></div>
          {embedUrl ? <div className="routine-video"><div className="routine-video-label"><Play size={15} /> VIDEO DEMOSTRATIVO</div><div className="routine-video-frame"><iframe src={embedUrl} title={`Video de ${exercise.nombre || 'ejercicio'}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div> : exercise.url_video ? <p className="routine-video-unavailable">El enlace de video no es una URL válida de YouTube.</p> : null}
        </article>
      })}</div>
      {(selectedDay.ejercicios || []).length === 0 && <div className="agenda-empty"><Dumbbell size={20} /><strong>Esta sesión no tiene ejercicios</strong><p>Consulta con tu preparador si esperabas ver una rutina aquí.</p></div>}
    </>}
    {!loading && !error && selectedPlanning && !selectedDay && <div className="client-state client-error">No encontramos ese día dentro de la planificación. Vuelve a la agenda y selecciona la sesión nuevamente.</div>}
    {!loading && !error && !selectedPlanningId && plannings.length === 0 && <div className="agenda-empty"><div className="client-icon-badge"><Dumbbell size={19} /></div><strong>Aún no tienes rutinas asignadas</strong><p>Cuando tu preparador cree un plan, aparecerá aquí en tu agenda.</p></div>}
    {!loading && !error && !selectedPlanningId && plannings.length > 0 && <div className="routine-planning-list">{plannings.map((planning) => {
      const exerciseCount = (planning.microciclos || []).reduce((count, cycle) => count + (cycle.dias_entrenamiento || []).reduce((dayCount, day) => dayCount + (day.ejercicios || []).length, 0), 0)
      return <article className="routine-card" key={planning._id}><div className="routine-card-top"><span className="routine-icon"><Dumbbell size={18} /></span><span className="routine-active">PLAN ACTIVO <i /></span></div><h2>{planning.nombre}</h2><p className="routine-goal"><Target size={14} /> {planning.objetivo}</p><div className="routine-summary"><span><CalendarDays size={14} /> {planning.microciclos?.length || 0} semanas</span><span><Dumbbell size={14} /> {exerciseCount} ejercicios</span></div><div className="routine-date-range">{shortDate(planning.fecha_inicio)} <span>—</span> {shortDate(planning.fecha_termino)}</div></article>
    })}</div>}
  </section>
}
