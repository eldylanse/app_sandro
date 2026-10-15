import { useEffect, useState } from 'react'
import { MessageSquareText, Star } from 'lucide-react'
import { createReview, getReviews } from '../../services/reviews.service'

export default function ReviewsRoute() {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refreshReviews() {
    const response = await getReviews()
    setReviews(response.reviews || [])
  }

  useEffect(() => {
    let active = true
    getReviews()
      .then((response) => { if (active) setReviews(response.reviews || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar las reseñas.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createReview({ estrellas: Number(rating), comentario: comment.trim() })
      setComment('')
      setNotice('Gracias por compartir tu experiencia.')
      await refreshReviews()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo publicar tu reseña.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="client-page">
    <div className="client-page-heading"><div><div className="client-kicker">TU EXPERIENCIA TAMBIÉN CUENTA</div><h1>Reseñas <em>de atletas.</em></h1><p>Comparte cómo va tu proceso y conoce las experiencias de la comunidad.</p></div></div>
    <form className="review-form" onSubmit={submit}><div className="review-form-heading"><span className="client-icon-badge"><MessageSquareText size={19} /></span><div><h2>Cuéntanos tu experiencia</h2><p>Tu reseña ayuda a otros a dar el primer paso.</p></div></div><label>Tu calificación<select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((stars) => <option key={stars} value={stars}>{stars} {stars === 1 ? 'estrella' : 'estrellas'}</option>)}</select></label><label>Tu comentario<textarea rows="4" value={comment} onChange={(event) => setComment(event.target.value)} minLength={3} maxLength={1000} required placeholder="¿Qué destacarías de tu entrenamiento?" /></label>{error && <p className="client-error" role="alert">{error}</p>}{notice && <p className="review-notice" role="status">{notice}</p>}<button className="button button-primary" disabled={saving}>{saving ? 'Publicando…' : 'Publicar reseña'}</button></form>
    <div className="review-list-heading"><div className="client-kicker">COMUNIDAD</div><h2>Lo que cuentan otros</h2></div>
    {loading && <div className="client-state">Cargando reseñas…</div>}
    {!loading && reviews.length === 0 && <p className="measurements-empty">Todavía no hay reseñas. Puedes ser la primera persona en compartir su experiencia.</p>}
    <div className="client-reviews">{reviews.map((review) => <article className="client-review-card" key={review._id}><div className="review-stars" aria-label={`${review.estrellas} de 5 estrellas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.estrellas ? 'currentColor' : 'none'} />)}</div><p>“{review.comentario}”</p><div className="review-author">{review.id_cliente?.nombre || 'Cliente'} <span>{review.fecha_creacion ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(review.fecha_creacion)) : ''}</span></div></article>)}</div>
  </section>
}
