import { useEffect, useMemo, useState } from 'react'
import { Dumbbell, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { createExercise, deleteExercise, getExercises, updateExercise } from '../../services/exercises.service'

const emptyExercise = { nombre: '', descripcion: '', categoria: '', url_video: '' }

export default function ExercisesRoute() {
  const [exercises, setExercises] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState(null)
  const [categoryMode, setCategoryMode] = useState('existing')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyExercise)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refresh() {
    const response = await getExercises()
    setExercises(response.exercises || [])
  }

  useEffect(() => {
    let active = true
    getExercises().then((response) => { if (active) setExercises(response.exercises || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar los ejercicios.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const categories = useMemo(() => [...new Set(exercises.map((exercise) => exercise.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [exercises])
  const visibleExercises = exercises.filter((exercise) => {
    const matchesQuery = `${exercise.nombre} ${exercise.descripcion}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!category || exercise.categoria === category)
  })

  function openForm(exercise = null) {
    setEditing(exercise)
    setFormOpen(true)
    setCategoryMode(exercise && !categories.includes(exercise.categoria) ? 'custom' : 'existing')
    setForm(exercise ? { nombre: exercise.nombre, descripcion: exercise.descripcion, categoria: exercise.categoria, url_video: exercise.url_video || '' } : emptyExercise)
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (editing) await updateExercise(editing._id, form)
      else await createExercise(form)
      await refresh()
      setNotice(editing ? 'Ejercicio actualizado.' : 'Ejercicio agregado al catálogo.')
      setFormOpen(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo guardar el ejercicio.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(exercise) {
    if (!window.confirm(`¿Eliminar el ejercicio “${exercise.nombre}”?`)) return
    try {
      await deleteExercise(exercise._id)
      setExercises((current) => current.filter((item) => item._id !== exercise._id))
      setNotice('Ejercicio eliminado.')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo eliminar el ejercicio.')
    }
  }

  return <section className="admin-page">
    <div className="admin-page-heading"><div><div className="admin-kicker">CATÁLOGO DE MOVIMIENTOS</div><h1>Biblioteca de <em>ejercicios.</em></h1><p>Organiza los movimientos que utilizas en las rutinas.</p></div><button className="button button-primary admin-action" onClick={() => openForm()}><Plus size={16} />Agregar ejercicio</button></div>
    {error && <p className="admin-alert" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="exercise-toolbar"><label className="admin-search"><Search size={16} /><input aria-label="Buscar ejercicios" placeholder="Buscar por nombre o descripción" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filtrar categoría" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas las categorías</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><span className="admin-result-count">{visibleExercises.length} resultados</span></div>
    {loading && <div className="admin-state">Cargando ejercicios…</div>}
    {!loading && !error && visibleExercises.length === 0 && <div className="admin-empty"><Dumbbell size={21} /><strong>No hay ejercicios para mostrar</strong><p>Agrega un ejercicio o cambia los filtros.</p></div>}
    <div className="exercise-list">{visibleExercises.map((exercise) => <article className="exercise-admin-card" key={exercise._id}><div className="exercise-admin-icon"><Dumbbell size={18} /></div><div className="exercise-admin-main"><div className="exercise-title-row"><h2>{exercise.nombre}</h2><span className="category-tag">{exercise.categoria}</span></div><p>{exercise.descripcion}</p>{exercise.url_video && <a href={exercise.url_video} target="_blank" rel="noreferrer">Ver video demostrativo ↗</a>}</div><div className="exercise-admin-actions"><button aria-label={`Editar ${exercise.nombre}`} title="Editar" onClick={() => openForm(exercise)}><Pencil size={15} /></button><button aria-label={`Eliminar ${exercise.nombre}`} title="Eliminar" className="is-danger" onClick={() => remove(exercise)}><Trash2 size={15} /></button></div></article>)}</div>
    {formOpen && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="exercise-form-title"><button className="admin-modal-close" aria-label="Cerrar" onClick={() => setFormOpen(false)}><X size={19} /></button><div className="admin-kicker">CATÁLOGO DE EJERCICIOS</div><h2 id="exercise-form-title">{editing ? 'Editar ejercicio' : 'Agregar ejercicio'}</h2><form className="admin-form" onSubmit={submit}><label>Nombre<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required /></label><label>Categoría<select value={categoryMode === 'custom' ? '__new__' : form.categoria} onChange={(event) => { if (event.target.value === '__new__') { setCategoryMode('custom'); setForm((current) => ({ ...current, categoria: '' })) } else { setCategoryMode('existing'); setForm((current) => ({ ...current, categoria: event.target.value })) } }} required><option value="">Selecciona una categoría</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}<option value="__new__">Crear categoría nueva…</option></select>{categoryMode === 'custom' && <input className="new-exercise-category" aria-label="Nombre de la nueva categoría" value={form.categoria} onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))} placeholder="Escribe la nueva categoría" required />}</label><label>Descripción<textarea rows="4" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} required /></label><label>URL del video <small>opcional</small><input type="url" value={form.url_video} onChange={(event) => setForm({ ...form, url_video: event.target.value })} placeholder="https://…" /></label>{error && <p className="admin-alert">{error}</p>}<button className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear ejercicio'}</button></form></section></div>}
  </section>
}
