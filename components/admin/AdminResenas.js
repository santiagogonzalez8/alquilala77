'use client'

import { useState, useEffect } from 'react'
import styles from '../../app/admin/admin.module.css'

const PROJECT_ID = 'alquilala-77'
const DATABASE = 'alquilala'
const API_KEY = 'AIzaSyCfQxGT9EhJpv4vXZoMTHyy6Gl7Vih-f6w'

async function getResenas() {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/resenas?key=${API_KEY}&pageSize=100`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.documents || []).map(doc => {
    const f = doc.fields || {}
    return {
      id: doc.name.split('/').pop(),
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
}

function Estrellas({ valor }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= valor ? '#f59e0b' : '#d1d5db', fontSize: '1rem' }}>★</span>
      ))}
    </div>
  )
}

export default function AdminResenas({ propiedades }) {
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendientes')
  const [toast, setToast] = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const data = await getResenas()
    setResenas(data)
    setLoading(false)
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const cambiarEstado = async (id, aprobada) => {
    try {
      const { firestoreUpdate } = await import('@/lib/firebase')
      await firestoreUpdate('resenas', id, { aprobada })
      setResenas(prev => prev.map(r => r.id === id ? { ...r, aprobada } : r))
      showToast(aprobada ? '✅ Reseña aprobada' : '❌ Reseña rechazada')
    } catch (err) {
      showToast('Error al actualizar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta reseña?')) return
    try {
      const { firestoreDelete } = await import('@/lib/firebase')
      await firestoreDelete('resenas', id)
      setResenas(prev => prev.filter(r => r.id !== id))
      showToast('🗑️ Reseña eliminada')
    } catch {
      showToast('Error al eliminar')
    }
  }

  const getNombrePropiedad = (propiedadId) => {
    const prop = propiedades?.find(p => p.id === propiedadId)
    return prop?.titulo || propiedadId
  }

  const filtradas = resenas.filter(r => {
    if (filtro === 'pendientes') return !r.aprobada
    if (filtro === 'aprobadas') return r.aprobada
    return true
  })

  const pendientes = resenas.filter(r => !r.aprobada).length
  const aprobadas = resenas.filter(r => r.aprobada).length

  const formatFecha = (str) => {
    if (!str) return ''
    try {
      return new Date(str).toLocaleDateString('es-UY', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    } catch { return '' }
  }

  const formatMes = (str) => {
    if (!str) return ''
    const [y, m] = str.split('-')
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago',
      'sep','oct','nov','dic']
    return `${meses[parseInt(m) - 1]} ${y}`
  }

  return (
    <div className={styles.panel}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: 'var(--color-primary)', color: 'white',
          padding: '0.875rem 1.5rem', borderRadius: '8px',
          fontWeight: 600, fontSize: '0.9rem', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          ⭐ Reseñas
          {pendientes > 0 && (
            <span style={{
              background: '#ef4444', color: 'white',
              fontSize: '0.75rem', fontWeight: 700,
              padding: '0.2rem 0.6rem', borderRadius: '9999px',
              marginLeft: '0.75rem',
            }}>
              {pendientes} pendientes
            </span>
          )}
        </h2>

        <div className={styles.filterBar}>
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todas">Todas ({resenas.length})</option>
            <option value="pendientes">⏳ Pendientes ({pendientes})</option>
            <option value="aprobadas">✅ Aprobadas ({aprobadas})</option>
          </select>
        </div>
      </div>

      <div className={styles.panelBody}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Cargando reseñas...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⭐</div>
            <h3>No hay reseñas {filtro === 'pendientes' ? 'pendientes' : ''}</h3>
            <p>
              {filtro === 'pendientes'
                ? 'Todas las reseñas están revisadas.'
                : 'Todavía no hay reseñas en la plataforma.'}
            </p>
          </div>
        ) : (
          filtradas.map(r => (
            <div key={r.id} className={styles.itemCard}>
              <div className={styles.itemInfo}>

                {/* Header reseña */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {r.userPhoto ? (
                    <img src={r.userPhoto} alt="" style={{
                      width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'
                    }} />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'var(--color-primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                    }}>
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.1rem' }}>
                      {r.userName}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {r.userEmail}
                    </p>
                  </div>
                </div>

                {/* Propiedad y puntuación */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{
                    background: 'var(--color-bg-warm)',
                    border: '1px solid var(--color-border-light)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}>
                    🏠 {getNombrePropiedad(r.propiedadId)}
                  </div>
                  <Estrellas valor={r.puntuacion} />
                  {r.fechaEstadia && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      📅 Estadía: {formatMes(r.fechaEstadia)}
                    </span>
                  )}
                </div>

                {/* Comentario */}
                <p style={{
                  fontSize: '0.92rem',
                  color: 'var(--color-text-light)',
                  lineHeight: 1.7,
                  marginBottom: '0.75rem',
                  padding: '0.875rem',
                  background: 'var(--color-bg-warm)',
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--color-border)',
                }}>
                  "{r.comentario}"
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    Enviada el {formatFecha(r.fecha)}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    background: r.aprobada ? '#d1fae5' : '#fff3e0',
                    color: r.aprobada ? '#065f46' : '#92400e',
                  }}>
                    {r.aprobada ? '✅ Aprobada' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className={styles.itemActions} style={{ flexDirection: 'column', gap: '0.5rem' }}>
                {!r.aprobada ? (
                  <button
                    onClick={() => cambiarEstado(r.id, true)}
                    style={{
                      background: '#2e7d32', color: 'white', border: 'none',
                      padding: '0.55rem 1rem', borderRadius: '8px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >
                    ✅ Aprobar
                  </button>
                ) : (
                  <button
                    onClick={() => cambiarEstado(r.id, false)}
                    style={{
                      background: '#f59e0b', color: 'white', border: 'none',
                      padding: '0.55rem 1rem', borderRadius: '8px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >
                    ⏸️ Pausar
                  </button>
                )}
                <button
                  onClick={() => eliminar(r.id)}
                  style={{
                    background: '#c62828', color: 'white', border: 'none',
                    padding: '0.55rem 1rem', borderRadius: '8px',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}