import { useEffect, useState } from 'react'
import { Activity, ArrowRight, Check, Dumbbell, Eye, EyeOff, Menu, ShieldCheck, Sparkles, Star, X } from 'lucide-react'
import { login } from './services/auth.service'
import { getFeaturedReviews } from './services/reviews.service'
import brandIcon from './assets/icon.png'
import ClienteRoutes from './routes/ClienteRoutes'
import AdminRoutes from './routes/AdminRoutes'
import './App.css'

const tokenKey = 'sandro.accessToken'
const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '56912345678').replace(/\D/g, '')

function planWhatsappUrl(planName) {
  const message = encodeURIComponent(`Hola, quiero consultar por el plan ${planName} de Tribu Fit.`)
  return `https://wa.me/${whatsappNumber}?text=${message}`
}

function whatsappUrl(messageText) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageText)}`
}

function roleFromToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role
  } catch {
    return null
  }
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey))
  const [loginOpen, setLoginOpen] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [contactPlan, setContactPlan] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [featuredReviews, setFeaturedReviews] = useState([])
  const role = token ? roleFromToken(token) : null

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (path.startsWith('/admin') || path.startsWith('/cliente')) return
    let active = true
    getFeaturedReviews()
      .then((data) => { if (active) setFeaturedReviews(data.reviews || []) })
      .catch(() => { if (active) setFeaturedReviews([]) })
    return () => { active = false }
  }, [path])

  function navigate(to) {
    window.history.pushState({}, '', to)
    setPath(to)
    setLoginOpen(false)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email, password })
      const accessToken = data.accessToken
      const userRole = roleFromToken(accessToken)
      if (!accessToken || !['admin', 'cliente'].includes(userRole)) {
        throw new Error('La respuesta de acceso no incluye un rol válido.')
      }
      localStorage.setItem(tokenKey, accessToken)
      setToken(accessToken)
      navigate(userRole === 'admin' ? '/admin' : '/cliente')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No pudimos iniciar sesión. Revisa tus datos e inténtalo otra vez.')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(tokenKey)
    setToken(null)
    navigate('/')
  }

  function openLogin() {
    window.history.pushState({}, '', '/')
    setPath('/')
    setLoginOpen(true)
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    if (!token || role !== 'admin') return <AccessDenied onHome={() => navigate('/')} onLogin={openLogin} />
    return <AdminRoutes token={token} onLogout={logout} />
  }
  if (path === '/cliente' || path.startsWith('/cliente/')) {
    if (!token || role !== 'cliente') return <AccessDenied onHome={() => navigate('/')} onLogin={openLogin} />
    return <ClienteRoutes onLogout={logout} />
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" onClick={(e) => { e.preventDefault(); navigate('/') }} aria-label="Tribu Fit, inicio">
          <span className="brand-mark"><img src={brandIcon} alt="" /></span>
          <span>TRIBU<span className="brand-light">FIT</span></span>
        </a>
        <button className="menu-toggle" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'}>
          <a href="#metodo" onClick={() => setMenuOpen(false)}>Método</a>
          <a href="#planes" onClick={() => setMenuOpen(false)}>Planes</a>
          <a href="#sobre-mi" onClick={() => setMenuOpen(false)}>Sobre mí</a>
          <button className="button button-outline nav-login" onClick={() => { setLoginOpen(true); setMenuOpen(false) }}>Acceso clientes</button>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-image" role="img" aria-label="Entrenamiento de fuerza en el gimnasio" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> ENTRENAMIENTO PERSONALIZADO</p>
          <h1>Tu mejor versión<br />se <em>construye.</em></h1>
          <p className="hero-lead">Entrena con intención. Avanza con un plan hecho para ti, tu ritmo y tus objetivos.</p>
          <div className="hero-actions"><a className="button button-primary" href="#planes">Encuentra tu plan <ArrowRight size={17} /></a><button className="text-link" onClick={() => setLoginOpen(true)}>Ya soy cliente <span>↗</span></button></div>
          <div className="hero-proof"><div className="proof-avatars"><span>F</span><span>M</span><span>J</span></div><div><strong>Progreso que se nota</strong><small>Entrenamiento con seguimiento real</small></div></div>
        </div>
        <div className="hero-stamp"><Dumbbell size={17} /><span>FUERZA · MOVIMIENTO · CONSTANCIA</span></div>
      </section>

      <section className="ticker" aria-label="Principios de entrenamiento"><span>ENTRENA CON PROPÓSITO</span><i>✳</i><span>AVANZA A TU RITMO</span><i>✳</i><span>HAZLO SOSTENIBLE</span><i>✳</i><span>ENTRENA CON PROPÓSITO</span></section>

      <section className="intro section-wrap" id="metodo">
        <div className="intro-layout">
          <div className="method-column">
            <div className="section-kicker">01 — EL MÉTODO</div>
            <div className="intro-main"><h2>No necesitas más motivación.<br /><span>Necesitas un plan.</span></h2><p>Cada cuerpo, cada historia y cada objetivo son distintos. Por eso tu entrenamiento empieza escuchándote y se construye contigo, paso a paso.</p></div>
            <div className="method-grid">
              <article><span className="method-number">01</span><div className="method-icon"><Sparkles size={21} /></div><h3>Diseñado para ti</h3><p>Una rutina adaptada a tu experiencia, tus metas y el tiempo que tienes.</p></article>
              <article><span className="method-number">02</span><div className="method-icon"><Activity size={21} /></div><h3>Progreso medible</h3><p>Seguimos tus avances para ajustar el plan cuando tú evolucionas.</p></article>
              <article><span className="method-number">03</span><div className="method-icon"><ShieldCheck size={21} /></div><h3>Acompañamiento real</h3><p>Resuelve dudas y entrena con la confianza de tener apoyo experto.</p></article>
            </div>
          </div>
          <aside className="homepage-reviews" aria-labelledby="homepage-reviews-title">
            <div className="homepage-reviews-heading"><div><div className="section-kicker">EXPERIENCIAS REALES</div><h3 id="homepage-reviews-title">Sus palabras,<br />su progreso.</h3></div><span className="reviews-direction" aria-hidden="true">←</span></div>
            {featuredReviews.length > 0 ? <div className="review-marquee" aria-label="Reseñas destacadas">
              <div className="review-marquee-track">{[...featuredReviews, ...featuredReviews].map((review, index) => <article className="homepage-review-card" key={`${review._id || review.id}-${index}`} aria-hidden={index >= featuredReviews.length}>
                <div className="homepage-review-stars" aria-label={`${review.estrellas} de 5 estrellas`}>{Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} size={14} fill={starIndex < review.estrellas ? 'currentColor' : 'none'} />)}</div>
                <p>“{review.comentario}”</p><strong>{review.id_cliente?.nombre || 'Cliente'}</strong>
              </article>)}</div>
            </div> : <p className="homepage-reviews-empty">Aún no hay reseñas destacadas.</p>}
          </aside>
        </div>
      </section>

      <section className="plans-section" id="planes"><div className="section-wrap plans-wrap"><div className="section-kicker">02 — PLANES DE ENTRENAMIENTO</div><div className="plans-heading"><h2>Un buen plan<br /><span>lo cambia todo.</span></h2><p>Elige el enfoque de entrenamiento y la duración que mejor se adapte a tus objetivos.</p></div>
        <div className="plans-grid">
          <article className="plan-card plan-video"><div className="plan-top"><span> ENTRENAMIENTO EN VIVO</span><span className="plan-dot" /></div><h3>Videollamadas</h3><p className="plan-desc">Entrena acompañado y recibe correcciones en tiempo real.</p><ul><li><Check size={15} />3 sesiones individuales por semana</li><li><Check size={15} />Sesiones de 45 a 60 minutos</li><li><Check size={15} />Corrección de técnica en tiempo real</li><li><Check size={15} />Ejercicios adaptados a tu nivel y materiales</li><li><Check size={15} />Seguimiento de objetivos</li></ul><div className="plan-prices" aria-label="Precios del plan Videollamadas"><div className="plan-price-row"><span>Mensual</span><strong>$99.990</strong></div><div className="plan-price-row"><span>Trimestral</span><strong>$269.990</strong></div><div className="plan-price-row"><span>Semestral</span><strong>$499.990</strong></div></div><button className="button button-dark" type="button" onClick={() => setContactPlan('Videollamadas')}>Consultar por WhatsApp <ArrowRight size={16} /></button></article>
          <article className="plan-card plan-routines"><div className="plan-top"><span> AUTONOMÍA Y ESTRUCTURA</span><span className="plan-dot" /></div><h3>Rutinas personalizadas</h3><p className="plan-desc">Una planificación a tu medida con seguimiento y ajustes semanales.</p><ul><li><Check size={15} />Evaluación inicial de objetivos y experiencia</li><li><Check size={15} />Rutina personalizada de 5 a 6 días por semana</li><li><Check size={15} />Indicaciones técnicas y alternativas según tus materiales</li><li><Check size={15} />Revisión semanal del progreso</li><li><Check size={15} />Ajustes programados</li></ul><div className="plan-prices" aria-label="Precios del plan Rutinas personalizadas"><div className="plan-price-row"><span>Mensual</span><strong>$39.990</strong></div><div className="plan-price-row"><span>Trimestral</span><strong>$109.990</strong></div><div className="plan-price-row"><span>Semestral</span><strong>$199.990</strong></div></div><button className="button button-dark" type="button" onClick={() => setContactPlan('Rutinas personalizadas')}>Consultar por WhatsApp <ArrowRight size={16} /></button></article>
          <article className="plan-card plan-featured"><div className="plan-top"><span> INTEGRAL · ACOMPAÑAMIENTO COMPLETO</span><span className="plan-dot" /></div><h3>Integral</h3><p className="plan-desc">Combina sesiones en vivo, planificación y seguimiento continuo.</p><ul><li><Check size={15} />3 sesiones individuales por semana por videollamada</li><li><Check size={15} />Rutina personalizada de 5 a 6 días por semana</li><li><Check size={15} />Evaluación inicial y objetivos individualizados</li><li><Check size={15} />Corrección técnica en vivo</li><li><Check size={15} />Seguimiento, ajustes semanales y evaluaciones periódicas</li><li><Check size={15} />Planificación progresiva</li></ul><div className="plan-prices" aria-label="Precios del plan Integral"><div className="plan-price-row"><span>Mensual</span><strong>$129.990</strong></div><div className="plan-price-row"><span>Trimestral</span><strong>$359.990</strong></div><div className="plan-price-row"><span>Semestral</span><strong>$659.990</strong></div></div><button className="button button-primary" type="button" onClick={() => setContactPlan('Integral')}>Consultar por WhatsApp <ArrowRight size={16} /></button></article>
        </div><p className="plans-note">¿No sabes cuál elegir? <button onClick={() => document.getElementById('sobre-mi')?.scrollIntoView({ behavior: 'smooth' })}>Conversemos primero.</button></p>
      </div></section>

      <section className="about section-wrap" id="sobre-mi"><div className="about-image"><div className="about-image-label">ENTRENAMIENTO CON INTENCIÓN</div></div><div className="about-copy"><div className="section-kicker">03 — SOBRE MÍ</div><p className="about-pretitle">TU PREPARADOR FÍSICO</p><h2>Me importa tu<br /><em>proceso.</em></h2><p>Creo que entrenar bien no se trata de hacerlo todo perfecto. Se trata de tener una guía clara, ser constante y aprender a confiar en lo que tu cuerpo puede hacer.</p><p>Como preparador físico, mi trabajo es acompañarte con un plan que tenga sentido para ti. Sin fórmulas mágicas: con criterio, conversación y progreso.</p><a className="text-link about-link" href="mailto:hola@sandrotraining.cl">Hablemos de tus objetivos <ArrowRight size={16} /></a></div></section>

      <section className="closing-cta"><div className="section-kicker">TU SIGUIENTE PASO</div><h2>El mejor momento<br />para empezar es <em>ahora.</em></h2><a className="button button-primary" href={whatsappUrl("Hola, quiero conocer los planes de Tribu Fit.")} target="_blank" rel="noreferrer">Hablemos de tu plan <ArrowRight size={17} /></a></section>

      <footer className="footer"><a className="brand" href="#inicio"><span className="brand-mark"><img src={brandIcon} alt="" /></span><span>TRIBU<span className="brand-light">FIT</span></span></a><p>Entrenamiento con propósito.</p><div><a href="#metodo">Método</a><a href="#planes">Planes</a><a href="#sobre-mi">Sobre mí</a><button onClick={() => setLoginOpen(true)}>Acceso clientes</button></div><small>© {new Date().getFullYear()} Tribu Fit</small></footer>

      {loginOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setLoginOpen(false) }}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setLoginOpen(false)}><X size={20} /></button><div className="login-mark"><img src={brandIcon} alt="" /></div><p className="section-kicker">QUÉ BUENO TENERTE DE VUELTA</p><h2 id="login-title">Tu entrenamiento<br /><em>te espera.</em></h2><p className="login-hint">Inicia sesión para continuar con tu plan.</p><form onSubmit={submitLogin}><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="username" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required /><label htmlFor="password">Contraseña</label><div className="login-password-field"><input id="password" type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required /><button className="login-password-toggle" type="button" aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowLoginPassword((visible) => !visible)}>{showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary login-submit" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'} {!loading && <ArrowRight size={16} />}</button></form><p className="no-account">¿Aún no eres cliente? <span>Escríbeme para comenzar.</span></p></section></div>}
      {contactPlan && <div className="modal-backdrop contact-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setContactPlan('') }}><section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setContactPlan('')}><X size={20} /></button><p className="section-kicker">CONSULTA DE PLAN</p><h2 id="contact-modal-title">Conversemos sobre<br /><em>{contactPlan}.</em></h2><p>Cuéntame un poco sobre tus objetivos y resolveré tus dudas antes de que elijas. Te responderé personalmente para ayudarte a encontrar la mejor opción.</p><a className="button button-primary contact-whatsapp-button" href={planWhatsappUrl(contactPlan)} target="_blank" rel="noreferrer">Continuar por WhatsApp <ArrowRight size={16} /></a><a className="contact-email-link" href={`mailto:hola@sandrotraining.cl?subject=${encodeURIComponent(`Consulta plan ${contactPlan}`)}`}>También puedes escribir a hola@sandrotraining.cl</a></section></div>}
    </main>
  )
}

function AccessDenied({ onHome, onLogin }) {
  return <main className="access-page"><div className="login-mark"><img src={brandIcon} alt="" /></div><p className="section-kicker">ÁREA PRIVADA</p><h1>Tu espacio de<br /><em>entrenamiento.</em></h1><p>Inicia sesión con la cuenta que te entregó tu preparador.</p><button className="button button-primary" onClick={onLogin}>Iniciar sesión <ArrowRight size={16} /></button><button className="text-link" onClick={onHome}>Volver al inicio</button></main>
}

export default App
