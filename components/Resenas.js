'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import styles from './Resenas.module.css'

async function getResenas(propiedadId) {
  const PROJECT_ID = 'alquilala-77'
  const DATABASE = 'alquilala'
  const API_KEY = 'AIzaSyCfQxGT9EhJpv4vXZoMTHyy6Gl7Vih-f6w'

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/resenas?key=${API_KEY}&pageSize=100`
  )
  if (!res.ok) return []
  const data = await res.json()

  const docs = (data.documents || []).map(doc => {
    const f = doc.fields || {}
    const id = doc.name.split('/').pop()
    return {
      id,
      propiedadId: f.propiedadId?.stringValue || '',
      userEmail: f.userEmail?.stringValue || '',
      userName: f.userName?.stringValue || 'Huésped',
      userPhoto: f.userPhoto?.stringValue || '',
      puntuacion: Number(f.puntuacion?.integerValue || 0),
      comentario: f.comentario?.stringValue || '',
      fechaEstadia: f.fechaEstadia?.stringValue || '',
      fecha: f.fecha?.stringValue || '',
      aprobada: f.aprobada?.booleanValue || false,
    }
  })

  return docs.filter(d => d.propiedadId === propiedadId && d.aprobada)
}

function Estrellas({ valor, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0)

  return (
    <div className={styles.estrellas}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`${styles.estrella} ${styles[`estrella_${size}`]} ${(hover || valor) >= n ? styles.estrellaActiva : ''}`}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function FormResena({ propiedadId, onEnviada }) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [fechaEstadia, setFechaEstadia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = auth.currentUser

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!puntuacion) { setError('Seleccioná una puntuación'); return }
    if (comentario.trim().length < 20) { setError('El comentario debe tener al menos 20 caracteres'); return }
    if (!user) { setError('Debés iniciar sesión para dejar una reseña'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propiedadId,
          userEmail: user.email,
          userName: user.displayName || 'Huésped',
          userPhoto: user.photoURL || '',
          puntuacion,
          comentario,
          fechaEstadia,
        }),
      })

      if (!res.ok) throw new Error('Error al enviar')
      setPuntuacion(0)
      setComentario('')
      setFechaEstadia('')
      onEnviada()
    } catch {
      setError('Error al enviar la reseña. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className={styles.loginPrompt}>
        <p>Para dejar una reseña necesitás <a href="/login">iniciar sesión</a></p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.formTitulo}>Dejá tu reseña</h3>

      <div className={styles.formGroup}>
        <label>Puntuación *</label>
        <Estrellas valor={puntuacion} onChange={setPuntuacion} size="lg" />
        <span className={styles.puntuacionLabel}>
          {puntuacion === 1 && 'Malo'}
          {puntuacion === 2 && 'Regular'}
          {puntuacion === 3 && 'Bueno'}
          {puntuacion === 4 && 'Muy bueno'}
          {puntuacion === 5 && 'Excelente'}
        </span>
      </div>

      <div className={styles.formGroup}>
        <label>¿Cuándo te hospedaste? (opcional)</label>
        <input
          type="month"
          value={fechaEstadia}
          onChange={e => setFechaEstadia(e.target.value)}
          className={styles.input}
          max={new Date().toISOString().slice(0, 7)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Tu experiencia *</label>
        <textarea
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          rows={4}
          placeholder="Contá cómo fue tu estadía, qué te gustó más, recomendaciones para otros viajeros..."
          className={styles.textarea}
          maxLength={1000}
        />
        <span className={styles.charCount}>{comentario.length}/1000</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" disabled={loading} className={styles.btnEnviar}>
        {loading ? 'Enviando...' : 'Enviar reseña'}
      </button>

      <p className={styles.aviso}>
        Tu reseña será revisada antes de publicarse.
      </p>
    </form>
  )
}

export default function Resenas({ propiedadId }) {
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    cargar()
  }, [propiedadId])

  const cargar = async () => {
    setLoading(true)
    const data = await getResenas(propiedadId)
    setResenas(data)
    setLoading(false)
  }

  const promedio = resenas.length
    ? (resenas.reduce((sum, r) => sum + r.puntuacion, 0) / resenas.length).toFixed(1)
    : null

  const handleEnviada = () => {
    setEnviada(true)
    setMostrarForm(false)
  }

  const formatFecha = (str) => {
    if (!str) return ''
    try {
      return new Date(str).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })
    } catch { return '' }
  }

  const formatMes = (str) => {
    if (!str) return ''
    const [y, m] = str.split('-')
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${meses[parseInt(m) - 1]} ${y}`
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.titulo}>Reseñas</h2>
          {promedio && (
            <div className={styles.promedioWrapper}>
              <span className={styles.estrellaBig}>★</span>
              <span className={styles.promedio}>{promedio}</span>
              <span className={styles.totalResenas}>({resenas.length} reseña{resenas.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {!mostrarForm && !enviada && (
          <button className={styles.btnEscribir} onClick={() => setMostrarForm(true)}>
            ✏️ Escribir reseña
          </button>
        )}
      </div>

      {/* Enviada con éxito */}
      {enviada && (
        <div className={styles.successMsg}>
          <span>🎉</span>
          <div>
            <strong>¡Gracias por tu reseña!</strong>
            <p>La revisaremos y la publicaremos pronto.</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div className={styles.formWrapper}>
          <FormResena propiedadId={propiedadId} onEnviada={handleEnviada} />
          <button className={styles.btnCancelar} onClick={() => setMostrarForm(false)}>
            Cancelar
          </button>
        </div>
      )}

      {/* Lista de reseñas */}
      {loading ? (
        <div className={styles.loading}>
          <div className="loading-spinner" />
        </div>
      ) : resenas.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay reseñas para esta propiedad.</p>
          <p>¡Sé el primero en compartir tu experiencia!</p>
        </div>
      ) : (
        <div className={styles.lista}>
          {resenas.map(r => (
            <div key={r.id} className={styles.resenaCard}>
              <div className={styles.resenaHeader}>
                <div className={styles.resenaUser}>
                  {r.userPhoto ? (
                    <img src={r.userPhoto} alt={r.userName} className={styles.userAvatar} />
                  ) : (
                    <div className={styles.userAvatarPlaceholder}>
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={styles.userName}>{r.userName}</p>
                    {r.fechaEstadia && (
                      <p className={styles.userFecha}>Se hospedó en {formatMes(r.fechaEstadia)}</p>
                    )}
                  </div>
                </div>
                <div className={styles.resenaRight}>
                  <Estrellas valor={r.puntuacion} size="sm" />
                  <p className={styles.resenaFecha}>{formatFecha(r.fecha)}</p>
                </div>
              </div>
              <p className={styles.comentario}>{r.comentario}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}