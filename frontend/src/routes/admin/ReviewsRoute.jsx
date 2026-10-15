import { useEffect, useState } from 'react'
import { MessageSquareText, Star } from 'lucide-react'
import { getReviews, toggleFeaturedReview } from '../../services/reviews.service'

function dateLabel(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function ReviewsRoute() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refresh() {
    const response = await getReviews()
    setReviews(response.reviews || [])
  }

  useEffect(() => {
    let active = true
    getReviews().then((response) => { if (active) setReviews(response.reviews || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'No se pudieron cargar las reseñas.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function toggle(review) {
    setBusyId(review._id)
    setError('')
    setNotice('')
    try {
      const result = await toggleFeaturedReview(review._id)
      await refresh()
      setNotice(result.message || (review.destacada ? 'Reseña quitada del inicio.' : 'Reseña destacada en el inicio.'))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo actualizar la reseña.')
    } finally {
      setBusyId(null)
    }
  }

  const featuredCount = reviews.filter((review) => review.destacada).length
  return <section className="admin-page">
    <div className="admin-page-heading"><div><div className="admin-kicker">VOCES DE TUS CLIENTES</div><h1>Reseñas <em>recibidas.</em></h1><p>Elige hasta dos testimonios para mostrar en la página de inicio.</p></div><div className="featured-counter"><Star size={15} fill="currentColor" />{featuredCount} / 2 destacadas</div></div>
    {error && <p className="admin-alert" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    {loading && <div className="admin-state">Cargando reseñas…</div>}
    {!loading && !reviews.length && <div className="admin-empty"><MessageSquareText size={21} /><strong>Aún no hay reseñas</strong><p>Cuando tus clientes compartan su experiencia, aparecerá aquí.</p></div>}
    <div className="admin-review-list">{reviews.map((review) => <article className={`admin-review-card${review.destacada ? ' is-featured' : ''}`} key={review._id}><div className="review-client-avatar">{review.id_cliente?.nombre?.charAt(0)?.toUpperCase() || 'C'}</div><div className="admin-review-content"><div className="admin-review-top"><div><h2>{review.id_cliente?.nombre || 'Cliente'}</h2><span>{dateLabel(review.fecha_creacion)}</span></div><div className="admin-review-stars" aria-label={`${review.estrellas} de 5 estrellas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < review.estrellas ? 'currentColor' : 'none'} />)}</div></div><p>“{review.comentario}”</p><div className="admin-review-controls"><span className={review.destacada ? 'review-feature-state is-featured' : 'review-feature-state'}>{review.destacada ? 'Visible en inicio' : 'No visible en inicio'}</span><button className={`button ${review.destacada ? 'button-outline' : 'button-dark'}`} disabled={busyId === review._id || (!review.destacada && featuredCount >= 2)} onClick={() => toggle(review)}>{busyId === review._id ? 'Actualizando…' : review.destacada ? 'Quitar del inicio' : 'Destacar en inicio'}</button></div>{!review.destacada && featuredCount >= 2 && <small className="review-limit-note">Quita una destacada antes de seleccionar otra.</small>}</div></article>)}</div>
  </section>
}
