'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { firestoreGetPublic } from '@/lib/firebase'
import SearchBar from '@/components/SearchBar'
import dynamic from 'next/dynamic'
import styles from './buscar.module.css'

const MapaPropiedades = dynamic(
  () => import('@/components/MapaPropiedades'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: '450px', background: 'var(--color-bg-warm)',
        borderRadius: '16px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-muted)', fontSize: '0.9rem',
      }}>
        Cargando mapa...
      </div>
    ),
  }
)

function calcularNoches(desde, hasta) {
  if (!desde || !hasta) return 0
  const d1 = new Date(desde)
  const d2 = new Date(hasta)
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24)
  return diff > 0 ? diff : 0
}

const AMENITIES_FILTRO = [
  'Piscina', 'WiFi', 'Aire acondicionado', 'Parrillero',
  'Apto mascotas', 'Estacionamiento', 'Vista al mar', 'Jacuzzi',
]

const TIPOS_PROPIEDAD = ['Casa', 'Apartamento', 'Cabaña', 'Chalet', 'Estudio', 'Villa']

function BuscarContenido() {
  const searchParams = useSearchParams()
  const donde = searchParams.get('donde') || ''
  const entrada = searchParams.get('entrada') || ''
  const salida = searchParams.get('salida') || ''
  const huespedes = parseInt(searchParams.get('huespedes') || '1')

  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaMap, setVistaMap] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Filtros locales
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('')
  const [amenitiesSeleccionadas, setAmenitiesSeleccionadas] = useState([])
  const [ordenar, setOrdenar] = useState('relevancia')

  useEffect(() => {
    const buscar = async () => {
      setLoading(true)
      try {
        const todas = await firestoreGetPublic(
          'propiedades',
          [{ field: 'estado', op: 'EQUAL', value: 'disponible' }],
          100
        )

        let filtradas = todas

        if (donde.trim()) {
          const q = donde.toLowerCase()
          filtradas = filtradas.filter(p =>
            p.ubicacion?.toLowerCase().includes(q) ||
            p.titulo?.toLowerCase().includes(q) ||
            p.descripcion?.toLowerCase().includes(q)
          )
        }

        if (huespedes > 1) {
          filtradas = filtradas.filter(p =>
            Number(p.huespedes || 0) >= huespedes
          )
        }

        if (entrada && salida) {
          filtradas = filtradas.filter(p => {
            const ocupadas = p.fechasOcupadas || []
            if (!ocupadas.length) return true
            const fechasRango = []
            const d = new Date(entrada)
            const fin = new Date(salida)
            while (d < fin) {
              fechasRango.push(d.toISOString().split('T')[0])
              d.setDate(d.getDate() + 1)
            }
            return !fechasRango.some(f => ocupadas.includes(f))
          })
        }

        setResultados(filtradas)
      } catch (error) {
        console.error('Error buscando:', error)
      } finally {
        setLoading(false)
      }
    }
    buscar()
  }, [donde, entrada, salida, huespedes])

  // Filtros locales aplicados sobre resultados
  const resultadosFiltrados = resultados
    .filter(p => {
      const precio = Number(p.precioPorNoche || 0)
      if (precioMin && precio < Number(precioMin)) return false
      if (precioMax && precio > Number(precioMax)) return false
      return true
    })
    .filter(p => {
      if (!tipoSeleccionado) return true
      return p.tipoPropiedad === tipoSeleccionado
    })
    .filter(p => {
      if (!amenitiesSeleccionadas.length) return true
      return amenitiesSeleccionadas.every(a => p.amenities?.includes(a))
    })
    .sort((a, b) => {
      if (ordenar === 'precio_asc') return Number(a.precioPorNoche) - Number(b.precioPorNoche)
      if (ordenar === 'precio_desc') return Number(b.precioPorNoche) - Number(a.precioPorNoche)
      if (ordenar === 'huespedes') return Number(b.huespedes) - Number(a.huespedes)
      return 0
    })

  const toggleAmenity = (a) => {
    setAmenitiesSeleccionadas(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    )
  }

  const limpiarFiltros = () => {
    setPrecioMin('')
    setPrecioMax('')
    setTipoSeleccionado('')
    setAmenitiesSeleccionadas([])
    setOrdenar('relevancia')
  }

  const hayFiltrosActivos = precioMin || precioMax || tipoSeleccionado || amenitiesSeleccionadas.length > 0

  const noches = calcularNoches(entrada, salida)

  return (
    <div className={styles.page}>

      {/* Barra de búsqueda sticky */}
      <div className={styles.searchTop}>
        <SearchBar />
      </div>

      <div className={styles.content}>

        {/* Header resultados */}
        <div className={styles.resultadosHeader}>
          <div style={{ flex: 1 }}>
            <h1 className={styles.titulo}>
              {loading ? 'Buscando...' : (
                donde
                  ? `${resultadosFiltrados.length} ${resultadosFiltrados.length === 1 ? 'propiedad' : 'propiedades'} en "${donde}"`
                  : `${resultadosFiltrados.length} ${resultadosFiltrados.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'}`
              )}
            </h1>

            {(donde || entrada || huespedes > 1) && (
              <div className={styles.filtrosActivos}>
                {donde && <span className={styles.filtroTag}>📍 {donde}</span>}
                {entrada && salida && (
                  <span className={styles.filtroTag}>
                    📅 {entrada} → {salida}
                    {noches > 0 && ` (${noches} noches)`}
                  </span>
                )}
                {huespedes > 1 && (
                  <span className={styles.filtroTag}>👥 {huespedes} huéspedes</span>
                )}
                {tipoSeleccionado && (
                  <span className={styles.filtroTag}>🏠 {tipoSeleccionado}</span>
                )}
                {(precioMin || precioMax) && (
                  <span className={styles.filtroTag}>
                    💰 {precioMin || '0'} — {precioMax || '∞'} USD
                  </span>
                )}
                {amenitiesSeleccionadas.map(a => (
                  <span key={a} className={styles.filtroTag}>✓ {a}</span>
                ))}
              </div>
            )}
          </div>

          {/* Controles derecha */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>

            {/* Ordenar */}
            <select
              value={ordenar}
              onChange={e => setOrdenar(e.target.value)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                background: 'white',
                cursor: 'pointer',
                color: 'var(--color-text)',
              }}
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="huespedes">Mayor capacidad</option>
            </select>

            {/* Botón filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem',
                border: hayFiltrosActivos
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                borderRadius: '8px',
                background: hayFiltrosActivos ? 'rgba(30,58,95,0.06)' : 'white',
                color: 'var(--color-primary)',
                fontWeight: hayFiltrosActivos ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            >
              ⚙️ Filtros
              {hayFiltrosActivos && (
                <span style={{
                  background: 'var(--color-primary)', color: 'white',
                  borderRadius: '50%', width: '18px', height: '18px',
                  fontSize: '0.7rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>
                  {[precioMin, precioMax, tipoSeleccionado].filter(Boolean).length + amenitiesSeleccionadas.length}
                </span>
              )}
            </button>

            {/* Toggle vista */}
            {!loading && resultados.length > 0 && (
              <div style={{
                display: 'flex',
                background: 'var(--color-bg-warm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '8px',
                padding: '0.25rem',
                gap: '0.25rem',
              }}>
                <button
                  onClick={() => setVistaMap(false)}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                    background: !vistaMap ? 'white' : 'transparent',
                    color: !vistaMap ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: !vistaMap ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.82rem',
                    boxShadow: !vistaMap ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >⊞ Lista</button>
                <button
                  onClick={() => setVistaMap(true)}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                    background: vistaMap ? 'white' : 'transparent',
                    color: vistaMap ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: vistaMap ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.82rem',
                    boxShadow: vistaMap ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >🗺️ Mapa</button>
              </div>
            )}
          </div>
        </div>

        {/* Panel de filtros desplegable */}
        {mostrarFiltros && (
          <div style={{
            background: 'white',
            border: '1px solid var(--color-border-light)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}>

              {/* Rango de precio */}
              <div>
                <p style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  marginBottom: '0.75rem',
                }}>
                  💰 Precio por noche (USD)
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Mín"
                    value={precioMin}
                    onChange={e => setPrecioMin(e.target.value)}
                    min="0"
                    style={{
                      flex: 1, border: '2px solid var(--color-border)',
                      borderRadius: '8px', padding: '0.55rem 0.75rem',
                      fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={precioMax}
                    onChange={e => setPrecioMax(e.target.value)}
                    min="0"
                    style={{
                      flex: 1, border: '2px solid var(--color-border)',
                      borderRadius: '8px', padding: '0.55rem 0.75rem',
                      fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Tipo de propiedad */}
              <div>
                <p style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  marginBottom: '0.75rem',
                }}>
                  🏠 Tipo de propiedad
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {TIPOS_PROPIEDAD.map(tipo => (
                    <button
                      key={tipo}
                      onClick={() => setTipoSeleccionado(tipoSeleccionado === tipo ? '' : tipo)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '999px',
                        border: tipoSeleccionado === tipo
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        background: tipoSeleccionado === tipo
                          ? 'var(--color-primary)' : 'white',
                        color: tipoSeleccionado === tipo ? 'white' : 'var(--color-text)',
                        fontSize: '0.82rem',
                        fontWeight: tipoSeleccionado === tipo ? 700 : 400,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  marginBottom: '0.75rem',
                }}>
                  ✨ Amenidades
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {AMENITIES_FILTRO.map(a => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '999px',
                        border: amenitiesSeleccionadas.includes(a)
                          ? '2px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        background: amenitiesSeleccionadas.includes(a)
                          ? 'var(--color-accent)' : 'white',
                        color: amenitiesSeleccionadas.includes(a) ? 'white' : 'var(--color-text)',
                        fontSize: '0.82rem',
                        fontWeight: amenitiesSeleccionadas.includes(a) ? 700 : 400,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer filtros */}
            {hayFiltrosActivos && (
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={limpiarFiltros}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                  }}
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <div className={styles.loading}>
            <div className="loading-spinner" />
            <p>Buscando propiedades...</p>
          </div>
        ) : resultadosFiltrados.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏖️</div>
            <h2>No encontramos propiedades</h2>
            <p>
              {hayFiltrosActivos
                ? 'Probá ajustando o limpiando los filtros.'
                : donde
                ? `No hay propiedades disponibles en "${donde}" con esos criterios.`
                : 'No hay propiedades disponibles con esos criterios.'
              }
            </p>
            <div className={styles.emptyAcciones}>
              {hayFiltrosActivos ? (
                <button
                  onClick={limpiarFiltros}
                  className={styles.btnLimpiar}
                >
                  Limpiar filtros
                </button>
              ) : (
                <Link href="/buscar" className={styles.btnLimpiar}>
                  Ver todas las propiedades
                </Link>
              )}
              <a
                href="https://wa.me/59895532294?text=Hola!%20Estoy%20buscando%20una%20propiedad%20y%20no%20encuentro%20lo%20que%20necesito"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnWA}
              >
                💬 Consultanos por WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <>
            {vistaMap && (
              <MapaPropiedades propiedades={resultadosFiltrados} altura="560px" />
            )}

            {!vistaMap && (
              <div className={styles.grid}>
                {resultadosFiltrados.map(prop => (
                  <Link
                    key={prop.id}
                    href={`/propiedades/${prop.id}`}
                    className={styles.card}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.gtag) {
                        window.gtag('event', 'select_item', {
                          item_id: prop.id,
                          item_name: prop.titulo,
                          item_location: prop.ubicacion,
                          search_term: donde,
                        })
                      }
                    }}
                  >
                    <div
                      className={styles.cardImg}
                      style={{
                        backgroundImage: prop.imagenes?.[0]
                          ? `url(${prop.imagenes[0]})`
                          : prop.fotoPrincipal
                          ? `url(${prop.fotoPrincipal})`
                          : 'linear-gradient(135deg, #1e3a5f, #2d4a6f)',
                      }}
                    >
                      <span className={styles.badge}>Disponible</span>
                      {prop.tipoPropiedad && (
                        <span style={{
                          position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                          background: 'rgba(30,58,95,0.85)', color: 'white',
                          fontSize: '0.72rem', fontWeight: 600,
                          padding: '0.2rem 0.6rem', borderRadius: '4px',
                        }}>
                          {prop.tipoPropiedad}
                        </span>
                      )}
                      {noches > 0 && (
                        <span className={styles.totalBadge}>
                          ${Number(prop.precioPorNoche) * noches} USD total
                        </span>
                      )}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardTitulo}>{prop.titulo}</h3>
                      <p className={styles.cardUbicacion}>📍 {prop.ubicacion}</p>
                      <div className={styles.cardDetalles}>
                        <span>👥 {prop.huespedes} huésp.</span>
                        <span>🛏️ {prop.dormitorios} dorm.</span>
                        <span>🚿 {prop.banos} baños</span>
                      </div>
                      {prop.amenities?.length > 0 && (
                        <div style={{
                          display: 'flex', gap: '0.3rem',
                          flexWrap: 'wrap', marginBottom: '0.5rem',
                        }}>
                          {prop.amenities.slice(0, 3).map((a, i) => (
                            <span key={i} style={{
                              fontSize: '0.72rem',
                              background: 'var(--color-bg-warm)',
                              color: 'var(--color-text-muted)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                            }}>
                              {a}
                            </span>
                          ))}
                          {prop.amenities.length > 3 && (
                            <span style={{
                              fontSize: '0.72rem',
                              color: 'var(--color-text-muted)',
                            }}>
                              +{prop.amenities.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className={styles.cardPrecio}>
                        <span className={styles.precioValor}>${prop.precioPorNoche}</span>
                        <span className={styles.precioLabel}> USD / noche</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="loading-spinner" />
      </div>
    }>
      <BuscarContenido />
    </Suspense>
  )
}