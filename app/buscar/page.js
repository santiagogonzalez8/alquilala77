'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { firestoreGetPublic } from '@/lib/firebase'
import SearchBar from '@/components/SearchBar'
import dynamic from 'next/dynamic'
import styles from './buscar.module.css'

// Importar mapa dinámicamente
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

function BuscarContenido() {
  const searchParams = useSearchParams()
  const donde = searchParams.get('donde') || ''
  const entrada = searchParams.get('entrada') || ''
  const salida = searchParams.get('salida') || ''
  const huespedes = parseInt(searchParams.get('huespedes') || '1')

  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaMap, setVistaMap] = useState(false)

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
          <div>
            <h1 className={styles.titulo}>
              {loading ? 'Buscando...' : (
                donde
                  ? `${resultados.length} ${resultados.length === 1 ? 'propiedad' : 'propiedades'} en "${donde}"`
                  : `${resultados.length} ${resultados.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'}`
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
              </div>
            )}
          </div>

          {/* Toggle vista */}
          {!loading && resultados.length > 0 && (
            <div style={{
              display: 'flex',
              background: 'var(--color-bg-warm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '8px',
              padding: '0.25rem',
              gap: '0.25rem',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setVistaMap(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: !vistaMap ? 'white' : 'transparent',
                  color: !vistaMap ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: !vistaMap ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: !vistaMap ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                ⊞ Lista
              </button>
              <button
                onClick={() => setVistaMap(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: vistaMap ? 'white' : 'transparent',
                  color: vistaMap ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: vistaMap ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: vistaMap ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                🗺️ Mapa
              </button>
            </div>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.loading}>
            <div className="loading-spinner" />
            <p>Buscando propiedades...</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏖️</div>
            <h2>No encontramos propiedades</h2>
            <p>
              {donde
                ? `No hay propiedades disponibles en "${donde}" con esos criterios.`
                : 'No hay propiedades disponibles con esos criterios.'
              }
            </p>
            <div className={styles.emptyAcciones}>
              <Link href="/buscar" className={styles.btnLimpiar}>
                Ver todas las propiedades
              </Link>
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
            {/* Vista mapa */}
            {vistaMap && (
              <MapaPropiedades
                propiedades={resultados}
                altura="560px"
              />
            )}

            {/* Vista lista */}
            {!vistaMap && (
              <div className={styles.grid}>
                {resultados.map(prop => (
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