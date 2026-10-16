import { useState } from 'react'
import { ArrowRight, HeartPulse, Ruler, Scale, UserRound } from 'lucide-react'
import { completeClientProfile } from '../../services/users.service'

export default function ProfileOnboardingRoute({ onComplete }) {
  const [form, setForm] = useState({ edad: '', altura: '', peso: '', informacion_medica: '', terminos_aceptados: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await completeClientProfile({
        ...form,
        edad: Number(form.edad),
        altura: Number(form.altura),
        peso: Number(form.peso),
      })
      onComplete(result.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos guardar tus datos. Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="client-onboarding">
      <div className="client-kicker">PRIMER INGRESO · CONFIGURACIÓN DE PERFIL</div>
      <div className="client-onboarding-heading">
        <div className="client-icon-badge"><UserRound size={22} /></div>
        <h1>Empecemos por<br /><em>conocerte.</em></h1>
        <p>Completa estos datos una sola vez para que tu preparador pueda adaptar el entrenamiento a ti.</p>
      </div>
      <form className="client-form" onSubmit={submit}>
        <div className="client-form-grid">
          <label><span><UserRound size={15} /> Edad</span><div className="client-input-wrap"><input type="number" min="13" max="100" value={form.edad} onChange={(event) => update('edad', event.target.value)} required placeholder="Ej. 28" /><small>años</small></div></label>
          <label><span><Ruler size={15} /> Estatura</span><div className="client-input-wrap"><input type="number" min="1" max="2.5" step="0.01" value={form.altura} onChange={(event) => update('altura', event.target.value)} required placeholder="Ej. 1.72" /><small>metros</small></div></label>
          <label><span><Scale size={15} /> Peso actual</span><div className="client-input-wrap"><input type="number" min="20" max="350" step="0.1" value={form.peso} onChange={(event) => update('peso', event.target.value)} required placeholder="Ej. 72.5" /><small>kg</small></div></label>
        </div>
        <label className="client-medical-label"><span><HeartPulse size={15} /> Información médica relevante <small>opcional</small></span><textarea rows="4" value={form.informacion_medica} onChange={(event) => update('informacion_medica', event.target.value)} placeholder="Lesiones, condiciones o consideraciones para tu entrenamiento…" /></label>
        <label className="client-terms"><input type="checkbox" checked={form.terminos_aceptados} onChange={(event) => update('terminos_aceptados', event.target.checked)} required /><span>Confirmo que la información es correcta y autorizo su uso para personalizar mi entrenamiento.</span></label>
        {error && <p className="client-error" role="alert">{error}</p>}
        <button className="button button-primary client-submit" disabled={loading}>{loading ? 'Guardando perfil…' : 'Guardar y continuar'} {!loading && <ArrowRight size={16} />}</button>
      </form>
      <p className="client-private-note">Tus datos se utilizarán para adaptar tu plan de entrenamiento.</p>
    </section>
  )
}
