'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { firestoreGetPublicById } from '@/lib/firebase';
import styles from './propiedad.module.css';

const AMENITY_ICONS = {
  // Destacados
  'Piscina':              '🏊',
  'Piscina climatizada':  '🏊',
  'Jacuzzi':              '🛁',
  'Vista al mar':         '🌊',
  'Vista a la playa':     '🏖️',
  'Frente al mar':        '🌊',
  'Acceso a la playa':    '🏖️',
  'Vista panorámica':     '🌅',
  // Tecnología
  'WiFi':                 '📶',
  'WiFi de alta velocidad': '📶',
  'Smart TV':             '📺',
  'TV cable':             '📺',
  'Netflix':              '🎬',
  'Proyector':            '🎥',
  'Consola de videojuegos': '🎮',
  // Clima
  'Aire acondicionado':   '❄️',
  'Calefacción':          '🔥',
  'Ventilador de techo':  '🌀',
  'Chimenea':             '🔥',
  // Cocina
  'Cocina equipada':      '🍳',
  'Cocina completa':      '🍳',
  'Microondas':           '📡',
  'Lavavajillas':         '🫧',
  'Cafetera':             '☕',
  'Nespresso':            '☕',
  'Heladera':             '🧊',
  'Freezer':              '🧊',
  'Horno':                '🫕',
  'Parrillero':           '🔥',
  'BBQ':                  '🔥',
  // Lavandería
  'Lavarropas':           '🫧',
  'Lavadora':             '🫧',
  'Secadora':             '🌬️',
  'Plancha':              '👔',
  // Exteriores
  'Jardín':               '🌿',
  'Terraza':              '🏡',
  'Balcón':               '🏡',
  'Patio':                '🌳',
  'Deck':                 '🪵',
  'Pérgola':              '🌿',
  'Ducha exterior':       '🚿',
  'Fogón':                '🔥',
  'Mesa de ping pong':    '🏓',
  'Hamaca':               '🌴',
  // Transporte
  'Estacionamiento':      '🚗',
  'Garage':               '🏠',
  'Estacionamiento privado': '🚗',
  // Familia / mascotas
  'Apto mascotas':        '🐾',
  'Cuna':                 '🛏️',
  'Silla alta bebé':      '👶',
  'Juguetes':             '🧸',
  'Piscina para niños':   '🏊',
  // Seguridad
  'Caja fuerte':          '🔒',
  'Alarma':               '🚨',
  'Cámaras exteriores':   '📷',
  'Detector de humo':     '🚒',
  'Extintor':             '🧯',
  // Acceso
  'Check-in autónomo':    '🔑',
  'Portero eléctrico':    '🔔',
  'Accesible':            '♿',
  // Trabajo
  'Escritorio':           '💻',
  'Lugar de trabajo':     '💼',
  // Default
  'default':              '✓',
};

function getAmenityIcon(name) {
  return AMENITY_ICONS[name] || AMENITY_ICONS['default'];
}

export default function PropiedadDetalle() {
  const { id } = useParams();
  const router = useRouter();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await firestoreGetPublicById('propiedades', id);
        if (!data || data.estado === 'rechazada' || data.estado === 'pausada') {
          setError(true);
        } else {
          setPropiedad(data);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  // Cerrar galería con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setGaleriaAbierta(false);
      if (e.key === 'ArrowRight' && galeriaAbierta) setFotoActiva(p => (p + 1) % fotos.length);
      if (e.key === 'ArrowLeft' && galeriaAbierta) setFotoActiva(p => (p - 1 + fotos.length) % fotos.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [galeriaAbierta]);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className="loading-spinner" />
        <p>Cargando propiedad...</p>
      </div>
    );
  }

  if (error || !propiedad) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorIcon}>🏚️</div>
        <h1>Propiedad no disponible</h1>
        <p>Esta propiedad no existe o no está disponible en este momento.</p>
        <Link href="/#propiedades" className={styles.btnBack}>← Volver al inicio</Link>
      </div>
    );
  }

  const fotos = propiedad.imagenes?.length > 0
    ? propiedad.imagenes
    : propiedad.fotoPrincipal
    ? [propiedad.fotoPrincipal]
    : [];

  const tieneFotos = fotos.length > 0;

  return (
    <div className={styles.page}>

      {/* ── Galería lightbox ── */}
      {galeriaAbierta && tieneFotos && (
        <div className={styles.lightbox} onClick={() => setGaleriaAbierta(false)}>
          <button className={styles.lightboxClose} onClick={() => setGaleriaAbierta(false)}>✕</button>
          <button
            className={`${styles.lightboxArrow} ${styles.lightboxLeft}`}
            onClick={(e) => { e.stopPropagation(); setFotoActiva(p => (p - 1 + fotos.length) % fotos.length); }}
          >‹</button>
          <img
            src={fotos[fotoActiva]}
            alt={`Foto ${fotoActiva + 1}`}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className={`${styles.lightboxArrow} ${styles.lightboxRight}`}
            onClick={(e) => { e.stopPropagation(); setFotoActiva(p => (p + 1) % fotos.length); }}
          >›</button>
          <div className={styles.lightboxCounter}>{fotoActiva + 1} / {fotos.length}</div>
        </div>
      )}

      {/* ── GALERÍA PRINCIPAL ── */}
      {tieneFotos ? (
        <div className={styles.galeria}>
          {/* Foto principal */}
          <div
            className={styles.galeriaMain}
            onClick={() => { setFotoActiva(0); setGaleriaAbierta(true); }}
          >
            <img src={fotos[0]} alt={propiedad.titulo} />
            {fotos.length > 1 && (
              <button
                className={styles.btnVerFotos}
                onClick={(e) => { e.stopPropagation(); setGaleriaAbierta(true); }}
              >
                📷 Ver {fotos.length} fotos
              </button>
            )}
          </div>
          {/* Miniaturas — max 4 a la derecha */}
          {fotos.length > 1 && (
            <div className={styles.galeriaThumbs}>
              {fotos.slice(1, 5).map((url, i) => (
                <div
                  key={i}
                  className={`${styles.galeriaThumb} ${i === 3 && fotos.length > 5 ? styles.galeriaThumbMore : ''}`}
                  onClick={() => { setFotoActiva(i + 1); setGaleriaAbierta(true); }}
                >
                  <img src={url} alt={`Foto ${i + 2}`} />
                  {i === 3 && fotos.length > 5 && (
                    <div className={styles.moreOverlay}>+{fotos.length - 5}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.galeriaPlaceholder}>
          <span>🏠</span>
          <p>Sin fotos disponibles</p>
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <div className={styles.contenido}>
        <div className={styles.columnaIzq}>

          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link href="/">Inicio</Link>
            <span>›</span>
            <Link href="/#propiedades">Propiedades</Link>
            <span>›</span>
            <span>{propiedad.titulo}</span>
          </nav>

          {/* Título y ubicación */}
          <div className={styles.encabezado}>
            <div className={styles.badges}>
              {propiedad.tipoPropiedad && (
                <span className={styles.tipoBadge}>{propiedad.tipoPropiedad}</span>
              )}
              <span className={styles.estadoBadge}>✅ Disponible</span>
            </div>
            <h1 className={styles.titulo}>{propiedad.titulo}</h1>
            <p className={styles.ubicacion}>📍 {propiedad.ubicacion}</p>
          </div>

          {/* Capacidad */}
          <div className={styles.capacidadGrid}>
            {[
              { icon: '👥', label: 'Huéspedes', value: propiedad.huespedes },
              { icon: '🛏️', label: 'Dormitorios', value: propiedad.dormitorios },
              { icon: '🛌', label: 'Camas', value: propiedad.camas },
              { icon: '🚿', label: 'Baños', value: propiedad.banos },
            ].map(item => item.value && (
              <div key={item.label} className={styles.capacidadItem}>
                <span className={styles.capacidadIcon}>{item.icon}</span>
                <div>
                  <p className={styles.capacidadValue}>{item.value}</p>
                  <p className={styles.capacidadLabel}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className={styles.divider} />

          {/* Descripción */}
          {propiedad.descripcion && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Sobre esta propiedad</h2>
              <p className={styles.descripcion}>{propiedad.descripcion}</p>
            </div>
          )}

          {/* Amenities */}
          {propiedad.amenities?.length > 0 && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Qué ofrece este lugar</h2>
              <div className={styles.amenitiesGrid}>
                {propiedad.amenities.map((amenity, i) => (
                  <div key={i} className={styles.amenityItem}>
                    <span className={styles.amenityIcon}>{getAmenityIcon(amenity)}</span>
                    <span className={styles.amenityNombre}>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className={styles.divider} />

          {/* Info adicional */}
          <div className={styles.seccion}>
            <h2 className={styles.seccionTitulo}>Información adicional</h2>
            <div className={styles.infoGrid}>
              {propiedad.tipoPropiedad && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tipo de propiedad</span>
                  <span className={styles.infoValue}>{propiedad.tipoPropiedad}</span>
                </div>
              )}
              {propiedad.temporada && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Temporada</span>
                  <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>{propiedad.temporada}</span>
                </div>
              )}
              {propiedad.fechaPublicacion && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Publicada</span>
                  <span className={styles.infoValue}>
                    {new Date(propiedad.fechaPublicacion).toLocaleDateString('es-UY', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── COLUMNA DERECHA — Tarjeta de reserva ── */}
        <div className={styles.columnaDer}>
          <div className={styles.reservaCard}>
            <div className={styles.reservaPrecio}>
              <span className={styles.reservaPrecioValor}>${propiedad.precioPorNoche}</span>
              <span className={styles.reservaPrecioLabel}> USD / noche</span>
            </div>

            <div className={styles.reservaCapacidad}>
              <div className={styles.reservaCapItem}>
                <span>👥</span>
                <span>Hasta {propiedad.huespedes} huéspedes</span>
              </div>
              <div className={styles.reservaCapItem}>
                <span>🛏️</span>
                <span>{propiedad.dormitorios} dormitorio{propiedad.dormitorios != 1 ? 's' : ''}</span>
              </div>
              <div className={styles.reservaCapItem}>
                <span>🚿</span>
                <span>{propiedad.banos} baño{propiedad.banos != 1 ? 's' : ''}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/59895532294?text=Hola!%20Me%20interesa%20la%20propiedad%20"${encodeURIComponent(propiedad.titulo)}"%20en%20${encodeURIComponent(propiedad.ubicacion)}.%20Quisiera%20consultar%20disponibilidad.`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnReserva}
            >
              💬 Consultar disponibilidad
            </a>

            <p className={styles.reservaHint}>
              Respondemos por WhatsApp en menos de 1 hora
            </p>

            <div className={styles.reservaGestionado}>
              <span>🏆</span>
              <div>
                <strong>Gestionado por Alquilala</strong>
                <p>Atención profesional, check-in y limpieza incluidos</p>
              </div>
            </div>
          </div>

          {/* Volver */}
          <Link href="/#propiedades" className={styles.btnVolver}>
            ← Ver más propiedades
          </Link>
        </div>
      </div>
    </div>
  );
}