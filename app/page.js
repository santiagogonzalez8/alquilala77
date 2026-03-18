'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { auth, firestoreGetPublic } from '@/lib/firebase'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import styles from './page.module.css'

const MapaPropiedades = dynamic(
  () => import('@/components/MapaPropiedades'),
  { ssr: false, loading: () => (
    <div style={{
      height: '450px', background: 'var(--color-bg-warm)',
      borderRadius: '16px', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-text-muted)', fontSize: '0.9rem',
    }}>
      Cargando mapa...
    </div>
  )}
)

function useOnScreen(ref, threshold = 0.15) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, threshold])
  return isVisible
}

function AnimatedSection({ children, className = '', style = {} }) {
  const ref = useRef(null)
  const isVisible = useOnScreen(ref)
  return (
    <div ref={ref} className={`animate-on-scroll ${isVisible ? 'visible' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}

function StaggerGrid({ children, className = '', style = {} }) {
  const ref = useRef(null)
  const isVisible = useOnScreen(ref)
  return (
    <div ref={ref} className={`stagger-children ${isVisible ? 'visible' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [propiedades, setPropiedades] = useState([])
  const [vistaMap, setVistaMap] = useState(false)

  const slides = [
    { name: 'Punta del Este', image: 'https://www.mejoruruguay.com/wp-content/uploads/2025/04/Puerto-Punta.webp', position: 'center' },
    { name: 'Cabo Polonio', image: 'https://demayorquierosermochilera.com/wp-content/uploads/2023/10/que-ver-cabo-polonio.webp', position: 'center' },
    { name: 'Punta del Diablo', image: 'https://images.trvl-media.com/place/6144089/c9fc188e-8ec8-47ef-86ad-3e9c9a9eb8dd.jpg', position: 'center' },
    { name: 'La Paloma', image: 'https://content.r9cdn.net/rimg/dimg/9f/96/f2478ec8-city-67086-172920a6c3d.jpg?crop=true&width=1366&height=768&xhint=3930&yhint=1459', position: 'center' },
    { name: 'Colonia del Sacramento', image: 'https://www.guruguay.com/wp-content/uploads/2021/05/colonia_del_sacramento_de_los_suspiros_street_night.png', position: 'center' },
    { name: 'Punta Negra', image: 'https://pbs.twimg.com/media/G5pSA0zWMAAxd2v.jpg', position: 'bottom right' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const cargarPropiedades = async () => {
      try {
        const props = await firestoreGetPublic(
          'propiedades',
          [{ field: 'estado', op: 'EQUAL', value: 'disponible' }],
          12
        )
        setPropiedades(props)
      } catch (error) {
        console.error('Error cargando propiedades:', error)
      }
    }
    cargarPropiedades()
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  const pasos = [
    { icon: '📋', titulo: 'Registrá tu propiedad', desc: 'Completá los datos de tu casa: fotos, ubicación, capacidad y amenities.' },
    { icon: '🚀', titulo: 'Nosotros la publicamos', desc: 'La publicamos en Airbnb, Booking y MercadoLibre con fotos y textos profesionales.' },
    { icon: '🛎️', titulo: 'Gestionamos todo', desc: 'Reservas, calendario, check-in/out, limpieza, mantenimiento y atención al huésped.' },
    { icon: '💰', titulo: 'Vos cobrás', desc: 'Recibís tus ingresos sin preocuparte por nada. Reportes claros y transparentes.' },
  ]

  const servicios = [
    { icon: '📢', titulo: 'Publicación multi-plataforma', desc: 'Tu propiedad en Airbnb, Booking y MercadoLibre simultáneamente, con fotos profesionales y textos optimizados.' },
    { icon: '📅', titulo: 'Gestión de calendario', desc: 'Sincronización de fechas en todas las plataformas. Sin superposiciones, sin errores.' },
    { icon: '🧹', titulo: 'Limpieza y mantenimiento', desc: 'Coordinamos limpieza entre huéspedes, cortapasto, reparaciones y todo lo que tu casa necesite.' },
    { icon: '💬', titulo: 'Atención al huésped 24/7', desc: 'Respondemos consultas, gestionamos check-in/out y resolvemos cualquier problema.' },
    { icon: '📊', titulo: 'Reportes de ingresos', desc: 'Dashboard con tus reservas, ingresos y gastos. Todo transparente y en tiempo real.' },
    { icon: '🔑', titulo: 'Gestión de llaves', desc: 'Coordinamos la entrega y devolución de llaves con cada huésped de forma segura.' },
  ]

  const testimonios = [
    {
      nombre: 'Marcela R.',
      ubicacion: 'Punta del Este',
      propiedad: 'Casa 4 dormitorios',
      texto: 'Antes pasaba meses con la casa vacía. Desde que confié en Alquilala tengo ocupación casi todo el año y sin hacer nada.',
      estrellas: 5,
    },
    {
      nombre: 'Diego F.',
      ubicacion: 'La Paloma',
      propiedad: 'Cabaña frente al mar',
      texto: 'El equipo se encarga de todo. Limpieza, llaves, consultas de los huéspedes... yo solo recibo el dinero al final del mes.',
      estrellas: 5,
    },
    {
      nombre: 'Valeria M.',
      ubicacion: 'Punta del Diablo',
      propiedad: 'Apartamento 2 amb.',
      texto: 'Lo que más valoro es la transparencia. Veo todos los movimientos en tiempo real y confío 100% en el equipo.',
      estrellas: 5,
    },
  ]

  return (
    <div className={styles.home}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={styles.heroSlide}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundPosition: slide.position || 'center',
              opacity: currentSlide === index ? 1 : 0,
            }}
          />
        ))}
        <div className={styles.heroOverlay} />
        <div className={styles.slideName}>📍 {slides[currentSlide].name}</div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Dejá tu propiedad en<br />nuestras manos
          </h1>
          <p className={styles.heroSubtitle}>
            Gestionamos tu alquiler temporal de forma integral.<br />
            Publicación, reservas, limpieza y atención al huésped.
          </p>
          <div className={styles.heroCtas}>
            <Link
              href={user ? '/publicar' : '/login'}
              className={styles.ctaPrimary}
            >
              Publicá tu casa
            </Link>
            <a href="#como-funciona" className={styles.ctaSecondary}>
              ¿Cómo funciona?
            </a>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className={`${styles.heroArrow} ${styles.arrowLeft}`}
          aria-label="Anterior"
        >‹</button>
        <button
          onClick={nextSlide}
          className={`${styles.heroArrow} ${styles.arrowRight}`}
          aria-label="Siguiente"
        >›</button>

        <div className={styles.heroDots}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`${styles.dot} ${currentSlide === index ? styles.dotActive : ''}`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>

        {/* SearchBar dentro del hero */}
        <div className={styles.heroSearch}>
          <SearchBar />
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className={`section-padding ${styles.comofunciona}`}>
        <div className="container" style={{ textAlign: 'center' }}>
          <AnimatedSection>
            <span className="section-label">Proceso simple</span>
            <h2 className="section-title">¿Cómo funciona?</h2>
            <p className="section-subtitle" style={{ margin: '0 auto 3rem' }}>
              En 4 simples pasos empezás a generar ingresos con tu propiedad sin moverte de tu casa.
            </p>
          </AnimatedSection>
          <StaggerGrid className={styles.pasosGrid}>
            {pasos.map((paso, i) => (
              <div key={i} className={styles.pasoCard}>
                <div className={styles.pasoNumber}>{i + 1}</div>
                <div className={styles.pasoIcon}>{paso.icon}</div>
                <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
                <p className={styles.pasoDesc}>{paso.desc}</p>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className={`section-padding ${styles.serviciosSection}`}>
        <div className="container">
          <AnimatedSection>
            <div style={{ textAlign: 'center' }}>
              <span className="section-label">Todo incluido</span>
              <h2 className="section-title">¿Qué hacemos por vos?</h2>
              <p className="section-subtitle" style={{ margin: '0 auto 3rem' }}>
                Nos encargamos de absolutamente todo para que vos solo disfrutes de los ingresos.
              </p>
            </div>
          </AnimatedSection>
          <StaggerGrid className={styles.serviciosGrid}>
            {servicios.map((serv, i) => (
              <div key={i} className={styles.servicioCard}>
                <div className={styles.servicioIcon}>{serv.icon}</div>
                <h3 className={styles.servicioTitulo}>{serv.titulo}</h3>
                <p className={styles.servicioDesc}>{serv.desc}</p>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── PROPIEDADES ── */}
      <section id="propiedades" className={`section-padding ${styles.propiedadesSection}`}>
        <div className="container">
          <AnimatedSection>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}>
              <div>
                <span className="section-label">Portfolio</span>
                <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
                  Propiedades que gestionamos
                </h2>
                <p className="section-subtitle" style={{ margin: 0 }}>
                  Estas son algunas de las propiedades que ya confían en nosotros.
                </p>
              </div>

              {propiedades.length > 0 && (
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
                      padding: '0.5rem 1rem', borderRadius: '6px', border: 'none',
                      background: !vistaMap ? 'white' : 'transparent',
                      color: !vistaMap ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: !vistaMap ? 700 : 500, cursor: 'pointer',
                      fontSize: '0.85rem',
                      boxShadow: !vistaMap ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                  >
                    ⊞ Cards
                  </button>
                  <button
                    onClick={() => setVistaMap(true)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '6px', border: 'none',
                      background: vistaMap ? 'white' : 'transparent',
                      color: vistaMap ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: vistaMap ? 700 : 500, cursor: 'pointer',
                      fontSize: '0.85rem',
                      boxShadow: vistaMap ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                  >
                    🗺️ Mapa
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>

          {propiedades.length > 0 ? (
            <>
              {vistaMap && (
                <AnimatedSection>
                  <MapaPropiedades propiedades={propiedades} altura="520px" />
                </AnimatedSection>
              )}
              {!vistaMap && (
                <StaggerGrid className={styles.propiedadesGrid}>
                  {propiedades.map((prop) => (
                    <Link
                      key={prop.id}
                      href={`/propiedades/${prop.id}`}
                      className={styles.propiedadCard}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'select_item', {
                            item_id: prop.id,
                            item_name: prop.titulo,
                            item_location: prop.ubicacion,
                          })
                        }
                      }}
                    >
                      <div
                        className={styles.propiedadImagen}
                        style={{
                          backgroundImage: prop.imagenes?.[0]
                            ? `url(${prop.imagenes[0]})`
                            : prop.fotoPrincipal
                            ? `url(${prop.fotoPrincipal})`
                            : 'linear-gradient(135deg, #1e3a5f, #2d4a6f)',
                        }}
                      >
                        <span className={styles.propiedadBadge}>Disponible</span>
                      </div>
                      <div className={styles.propiedadInfo}>
                        <h3 className={styles.propiedadTitulo}>{prop.titulo}</h3>
                        <p className={styles.propiedadUbicacion}>📍 {prop.ubicacion}</p>
                        <div className={styles.propiedadDetalles}>
                          <span>👥 {prop.huespedes} huéspedes</span>
                          <span>🛏️ {prop.dormitorios} dorm.</span>
                          <span>🚿 {prop.banos} baños</span>
                        </div>
                        <div className={styles.propiedadPrecio}>
                          <span className={styles.precioValor}>${prop.precioPorNoche}</span>
                          <span className={styles.precioNoche}>/ noche</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </StaggerGrid>
              )}
            </>
          ) : (
            <AnimatedSection>
              <div className={styles.propiedadesEmpty}>
                <div className={styles.emptyIcon}>🏡</div>
                <h3>Próximamente</h3>
                <p>Estamos incorporando propiedades. ¡Sé el primero en publicar la tuya!</p>
                <Link href={user ? '/publicar' : '/login'} className={styles.ctaPrimary}>
                  Publicá tu propiedad
                </Link>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className={`section-padding ${styles.serviciosSection}`}>
        <div className="container" style={{ textAlign: 'center' }}>
          <AnimatedSection>
            <span className="section-label">Propietarios que confían</span>
            <h2 className="section-title">Lo que dicen nuestros clientes</h2>
            <p className="section-subtitle" style={{ margin: '0 auto 3rem' }}>
              Propietarios de todo Uruguay ya generan ingresos con Alquilala.
            </p>
          </AnimatedSection>

          <StaggerGrid className={styles.serviciosGrid}>
            {testimonios.map((t, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.75rem',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                  {[...Array(t.estrellas)].map((_, j) => (
                    <span key={j} style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--color-text-light)',
                  lineHeight: 1.7,
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                }}>
                  "{t.texto}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--color-primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {t.nombre.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', margin: 0, fontSize: '0.95rem' }}>
                      {t.nombre}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.8rem' }}>
                      {t.propiedad} · {t.ubicacion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── COMISIÓN VISIBLE ── */}
      <section className="section-padding" style={{ background: 'white' }}>
        <div className="container">
          <AnimatedSection>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span className="section-label">Sin letra chica</span>
              <h2 className="section-title">Precios claros y transparentes</h2>
              <p className="section-subtitle" style={{ margin: '0 auto' }}>
                Sin costos fijos ni sorpresas. Solo pagás cuando generás ingresos.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div style={{
              maxWidth: '680px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #0f2942 100%)',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              textAlign: 'center',
              color: 'white',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰</div>
              <p style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.75, marginBottom: '0.25rem' }}>
                Comisión por reserva concretada
              </p>
              <div style={{
                fontSize: '5.5rem',
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: '0.25rem',
                letterSpacing: '-2px',
              }}>
                15%
              </div>
              <p style={{ opacity: 0.7, marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Solo cuando vos ganás, nosotros ganamos.<br />
                Sin cuota mensual, sin contrato de permanencia.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.875rem',
                marginBottom: '2.5rem',
                textAlign: 'left',
              }}>
                {[
                  '✅ Publicación en Airbnb y Booking',
                  '✅ Gestión de reservas 24/7',
                  '✅ Limpieza entre huéspedes',
                  '✅ Mantenimiento y reparaciones',
                  '✅ Atención al huésped completa',
                  '✅ Reportes de ingresos claros',
                ].map((item, i) => (
                  <div key={i} style={{
                    fontSize: '0.9rem',
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    {item}
                  </div>
                ))}
              </div>

              <Link
                href={user ? '/publicar' : '/login'}
                style={{
                  display: 'inline-block',
                  background: 'var(--color-accent)',
                  color: 'white',
                  padding: '1rem 2.5rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                Empezar ahora — es gratis →
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.ctaSection}>
        <div className="container" style={{ textAlign: 'center' }}>
          <AnimatedSection>
            <h2 className={styles.ctaTitulo}>¿Tenés una propiedad sin explotar?</h2>
            <p className={styles.ctaSubtitulo}>
              Dejanos encargarnos de todo. Empezá a generar ingresos con tu casa hoy mismo.
            </p>
            <div className={styles.ctaButtons}>
              <Link
                href={user ? '/publicar' : '/login'}
                className={styles.ctaPrimaryLarge}
              >
                Quiero publicar mi casa
              </Link>
              <a
                href="https://wa.me/59895532294?text=Hola!%20Quiero%20información%20sobre%20el%20servicio%20de%20gestión%20de%20alquileres"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaWhatsapp}
              >
                💬 Hablemos por WhatsApp
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  )
}