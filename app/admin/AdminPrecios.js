'use client'

import { useState, useEffect } from 'react'
import { firestoreGetAll, firestoreUpdate } from '@/lib/firebase'
import { TEMPORADAS } from '@/lib/temporadas'
import styles from '../../app/admin/admin.module.css'

export default function AdminPrecios({ propiedades, onRefresh }) {
  const [propSeleccionada, setPropSeleccionada] = useState(null)
  const [precios, setPrecios] = useState({ alta: '', media: '', baja: '' })
  const [minNoches, setMinNoches] = useState({ alta: 3, media: 2, baja: 1 })
  const [descuentos, setDescuentos] = useState({ semana: 0, mes: 0 })
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (propSeleccionada) {
      setPrecios({
        alta: propSeleccionada.precioAlta || propSeleccionada.precioPorNoche || '',
        media: propSeleccionada.precioMedia || propSeleccionada.precioPorNoche || '',
        baja: propSeleccionada.precioBaja || propSeleccionada.precioPorNoche || '',
      })
      setMinNoches({
        alta: propSeleccionada.minNochesAlta || 3,
        media: propSeleccionada.minNochesMedia || 2,
        baja: propSeleccionada.minNochesBaja || 1,
      })
      setDescuentos({
        semana: propSeleccionada.descuentoSemana || 0,
        mes: propSeleccionada.descuentoMes || 0,
      })
    }
  }, [propSeleccionada])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const guardar = async () => {
    if (!propSeleccionada) return
    setGuardando(true)
    try {
      await firestoreUpdate('propiedades', propSeleccionada.id, {
        precioAlta: Number(precios.alta),
        precioMedia: Number(precios.media),
        precioBaja: Number(precios.baja),
        precioPorNoche: Number(precios.baja), // precio base sigue siendo baja
        minNochesAlta: Number(minNoches.alta),
        minNochesMedia: Number(minNoches.media),
        minNochesBaja: Number(minNoches.baja),
        descuentoSemana: Number(descuentos.semana),
        descuentoMes: Number(descuentos.mes),
      })
      showToast('✅ Precios guardados correctamente')
      onRefresh()
    } catch (err) {
      showToast('❌ Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const temporadasList = [
    { key: 'alta', ...TEMPORADAS.alta },
    { key: 'media', ...TEMPORADAS.media },
    { key: 'baja', ...TEMPORADAS.baja },
  ]

  return (
    <div className={styles.panel}>

      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: 'var(--color-primary)', color: 'white',
          padding: '0.875rem 1.5rem', borderRadius: '8px',
          fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>💰 Gestión de Precios por Temporada</h2>
      </div>

      <div className={styles.panelBody}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Lista propiedades */}
          <div style={{
            background: 'var(--color-bg-warm)',
            borderRadius: '12px',
            border: '1px solid var(--color-border-light)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid var(--color-border-light)',
              fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Propiedades
            </div>
            {propiedades.length === 0 ? (
              <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No hay propiedades
              </p>
            ) : propiedades.map(prop => (
              <button
                key={prop.id}
                onClick={() => setPropSeleccionada(prop)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 1.25rem', width: '100%',
                  background: propSeleccionada?.id === prop.id ? 'rgba(30,58,95,0.06)' : 'white',
                  border: 'none',
                  borderLeft: propSeleccionada?.id === prop.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                  borderBottom: '1px solid var(--color-border-light)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {(prop.imagenes?.[0] || prop.fotoPrincipal) && (
                  <img
                    src={prop.imagenes?.[0] || prop.fotoPrincipal}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.875rem', fontWeight: 600,
                    color: 'var(--color-text)', margin: 0, marginBottom: '0.15rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {prop.titulo}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    ${prop.precioPorNoche}/noche base
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Panel de precios */}
          {!propSeleccionada ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Seleccioná una propiedad
              </h3>
              <p>Elegí una propiedad para configurar sus precios por temporada</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                  {propSeleccionada.titulo}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  📍 {propSeleccionada.ubicacion}
                </p>
              </div>

              {/* Precios por temporada */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem',
                }}>
                  Precios por noche (USD)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {temporadasList.map(t => (
                    <div key={t.key} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '1rem',
                      padding: '1.25rem',
                      background: t.bg,
                      borderRadius: '12px',
                      border: `1px solid ${t.color}30`,
                    }}>
                      <div>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          gap: '0.5rem', marginBottom: '0.5rem',
                        }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: t.color, flexShrink: 0,
                          }} />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: t.color }}>
                            {t.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                          {t.descripcion}
                        </p>
                      </div>

                      <div>
                        <label style={{
                          display: 'block', fontSize: '0.75rem', fontWeight: 700,
                          color: 'var(--color-text-muted)', marginBottom: '0.4rem',
                        }}>
                          Precio/noche (USD)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>$</span>
                          <input
                            type="number"
                            value={precios[t.key]}
                            onChange={e => setPrecios(prev => ({ ...prev, [t.key]: e.target.value }))}
                            min="0"
                            placeholder="0"
                            style={{
                              width: '100%', border: '2px solid var(--color-border)',
                              borderRadius: '8px', padding: '0.6rem 0.75rem',
                              fontSize: '1rem', fontFamily: 'inherit',
                              fontWeight: 700, outline: 'none',
                              background: 'white',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{
                          display: 'block', fontSize: '0.75rem', fontWeight: 700,
                          color: 'var(--color-text-muted)', marginBottom: '0.4rem',
                        }}>
                          Mínimo de noches
                        </label>
                        <input
                          type="number"
                          value={minNoches[t.key]}
                          onChange={e => setMinNoches(prev => ({ ...prev, [t.key]: e.target.value }))}
                          min="1"
                          max="30"
                          style={{
                            width: '100%', border: '2px solid var(--color-border)',
                            borderRadius: '8px', padding: '0.6rem 0.75rem',
                            fontSize: '1rem', fontFamily: 'inherit',
                            outline: 'none', background: 'white',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descuentos */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem',
                }}>
                  Descuentos automáticos
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{
                    padding: '1.25rem', background: 'var(--color-bg-warm)',
                    borderRadius: '12px', border: '1px solid var(--color-border-light)',
                  }}>
                    <label style={{
                      display: 'block', fontSize: '0.875rem', fontWeight: 700,
                      color: 'var(--color-text)', marginBottom: '0.25rem',
                    }}>
                      🗓️ Descuento por semana
                    </label>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      7+ noches seguidas
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={descuentos.semana}
                        onChange={e => setDescuentos(prev => ({ ...prev, semana: e.target.value }))}
                        min="0" max="50"
                        style={{
                          width: '80px', border: '2px solid var(--color-border)',
                          borderRadius: '8px', padding: '0.6rem 0.75rem',
                          fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>%</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '1.25rem', background: 'var(--color-bg-warm)',
                    borderRadius: '12px', border: '1px solid var(--color-border-light)',
                  }}>
                    <label style={{
                      display: 'block', fontSize: '0.875rem', fontWeight: 700,
                      color: 'var(--color-text)', marginBottom: '0.25rem',
                    }}>
                      📅 Descuento por mes
                    </label>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      28+ noches seguidas
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={descuentos.mes}
                        onChange={e => setDescuentos(prev => ({ ...prev, mes: e.target.value }))}
                        min="0" max="50"
                        style={{
                          width: '80px', border: '2px solid var(--color-border)',
                          borderRadius: '8px', padding: '0.6rem 0.75rem',
                          fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {precios.alta && precios.media && precios.baja && (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(30,58,95,0.04)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border-light)',
                  marginBottom: '1.5rem',
                }}>
                  <h4 style={{
                    fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.875rem',
                  }}>
                    Vista previa de precios
                  </h4>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {temporadasList.map(t => (
                      <div key={t.key} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: t.color, margin: '0 auto 0.3rem',
                        }} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                          {t.label.replace('Temporada ', '')}
                        </p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: t.color, margin: '0.2rem 0 0' }}>
                          ${precios[t.key]}/noche
                        </p>
                        {descuentos.semana > 0 && (
                          <p style={{ fontSize: '0.72rem', color: '#22c55e', margin: 0 }}>
                            7+ noches: ${Math.round(precios[t.key] * (1 - descuentos.semana / 100))}/noche
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón guardar */}
              <button
                onClick={guardar}
                disabled={guardando}
                style={{
                  background: guardando ? '#ccc' : 'var(--color-primary)',
                  color: 'white', border: 'none',
                  padding: '0.875rem 2rem', borderRadius: '8px',
                  fontWeight: 700, fontSize: '1rem', cursor: guardando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', width: '100%',
                  transition: 'background 0.2s',
                }}
              >
                {guardando ? '⏳ Guardando...' : '💾 Guardar precios'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}