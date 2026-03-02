'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { firestoreGetPublicById, auth } from '@/lib/firebase';
import styles from './propiedad.module.css';

const AMENITY_ICONS = {
  'Piscina': '🏊', 'Piscina climatizada': '🏊', 'Jacuzzi': '🛁',
  'Vista al mar': '🌊', 'Vista a la playa': '🏖️', 'Frente al mar': '🌊',
  'Acceso a la playa': '🏖️', 'Vista panorámica': '🌅',
  'WiFi': '📶', 'WiFi de alta velocidad': '📶', 'Smart TV': '📺',
  'TV cable': '📺', 'Netflix': '🎬', 'Proyector': '🎥',
  'Consola de videojuegos': '🎮', 'Parlante Bluetooth': '🎵',
  'USB / carga inalámbrica': '🔌',
  'Aire acondicionado': '❄️', 'Calefacción central': '🔥',
  'Calefacción a leña': '🔥', 'Chimenea': '🔥',
  'Ventilador de techo': '🌀', 'Estufa eléctrica': '🔥',
  'Cocina equipada': '🍳', 'Cocina completa': '🍳',
  'Microondas': '📡', 'Lavavajillas': '🫧', 'Cafetera': '☕',
  'Nespresso': '☕', 'Heladera': '🧊', 'Freezer': '🧊',
  'Horno': '🫕', 'Tostadora': '🍞', 'Utensilios de cocina': '🥘',
  'Especias básicas': '🧂',
  'Jardín': '🌿', 'Terraza': '🏡', 'Balcón': '🏡', 'Patio': '🌳',
  'Deck': '🪵', 'Pérgola': '🌿', 'Parrillero': '🔥', 'BBQ': '🔥',
  'Fogón': '🔥', 'Ducha exterior': '🚿', 'Hamaca': '🌴',
  'Mesa de ping pong': '🏓', 'Reposeras': '🪑', 'Sombrilla': '⛱️',
  'Estacionamiento': '🚗', 'Estacionamiento privado': '🚗',
  'Garage': '🏠', 'Portero eléctrico': '🔔',
  'Check-in autónomo': '🔑', 'Acceso 24hs': '⏰',
  'Ropa de cama incluida': '🛏️', 'Toallas incluidas': '🛁',
  'Almohadas extra': '😴', 'Placard': '👔', 'Percheros': '🪝',
  'Caja fuerte': '🔒', 'Black-out (cortinas oscuras)': '🌑',
  'Lavarropas': '🫧', 'Secadora': '🌬️', 'Plancha': '👔',
  'Tendedero': '🧺', 'Lavandería compartida': '🫧',
  'Apto mascotas': '🐾', 'Cuna': '🛏️', 'Silla alta bebé': '👶',
  'Juguetes': '🧸', 'Piscina para niños': '🏊', 'Cercas de seguridad': '🔒',
  'Alarma': '🚨', 'Cámaras exteriores': '📷',
  'Detector de humo': '🚒', 'Extintor': '🧯',
  'Botiquín de primeros auxilios': '🏥', 'Detector de CO': '⚠️',
  'Escritorio': '💻', 'Lugar de trabajo': '💼', 'Gimnasio': '💪',
  'Sauna': '🧖', 'Bicicletas': '🚲', 'Tablas de surf': '🏄',
  'Accesible silla de ruedas': '♿', 'Baño adaptado': '♿',
  'Rampa de acceso': '♿', 'Sin escaleras': '♿',
};

function getAmenityIcon(name) {
  return AMENITY_ICONS[name] || '✓';
}

function formatFecha(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

function calcularNoches(desde, hasta) {
  if (!desde || !hasta) return 0;
  const d1 = new Date(desde);
  const d2 = new Date(hasta);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : 0;
}

function getFechasEntre(desde, hasta) {
  const result = [];
  const d = new Date(desde);
  d.setDate(d.getDate() + 1);
  const fin = new Date(hasta);
  while (d < fin) {
    result.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return result;
}

// ── Botón de pago MercadoPago ───────────────────────────────
function BtnPagar({ propiedad, fechaInicio, fechaFin, noches, total }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePagar = async () => {
    const user = auth.currentUser;
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/pagos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propiedadId: propiedad.id,
          titulo: propiedad.titulo,
          ubicacion: propiedad.ubicacion,
          fechaInicio,
          fechaFin,
          noches,
          precioPorNoche: propiedad.precioPorNoche,
          total,
          userEmail: user.email,
          userName: user.displayName || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear preferencia');

      window.location.href = data.init_point;

    } catch (err) {
      setError('No se pudo iniciar el pago. Intentá de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePagar}
        disabled={loading}
        style={{
          display: 'block',
          width: '100%',
          background: loading ? '#ccc' : '#009ee3',
          color: 'white',
          border: 'none',
          padding: '0.95rem',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
      >
        {loading ? '⏳ Redirigiendo...' : `💳 Reservar y pagar $${total} USD`}
      </button>
      {error && (
        <p style={{
          color: 'var(--color-danger)',
          fontSize: '0.82rem',
          marginTop: '0.5rem',
          textAlign: 'center'
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Calendario con selección de rango ──────────────────────
function CalendarioReserva({ fechasOcupadas = [], precioPorNoche, onRangoChange }) {
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];

  const [mesActual, setMesActual] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [hover, setHover] = useState(null);

  const year = mesActual.getFullYear();
  const month = mesActual.getMonth();
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDia = new Date(year, month, 1).getDay();

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diasSemana = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  const toDateStr = (dia) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

  const esPasado = (str) => str < hoyStr;
  const esOcupado = (str) => fechasOcupadas.includes(str);
  const esHoy = (str) => str === hoyStr;
  const esInicio = (str) => str === fechaInicio;
  const esFin = (str) => str === fechaFin;

  const esEnRango = (str) => {
    const fin = fechaFin || hover;
    if (!fechaInicio || !fin) return false;
    const [a, b] = fechaInicio < fin ? [fechaInicio, fin] : [fin, fechaInicio];
    return str > a && str < b;
  };

  const hayOcupadoEnRango = (desde, hasta) => {
    const fechas = getFechasEntre(desde, hasta);
    return fechas.some(f => fechasOcupadas.includes(f));
  };

  const handleClickDia = (str) => {
    if (esPasado(str) || esOcupado(str)) return;

    if (!fechaInicio || (fechaInicio && fechaFin)) {
      setFechaInicio(str);
      setFechaFin(null);
      onRangoChange(str, null);
      return;
    }

    if (str <= fechaInicio) {
      setFechaInicio(str);
      setFechaFin(null);
      onRangoChange(str, null);
      return;
    }

    if (hayOcupadoEnRango(fechaInicio, str)) {
      setFechaInicio(str);
      setFechaFin(null);
      onRangoChange(str, null);
      return;
    }

    setFechaFin(str);
    onRangoChange(fechaInicio, str);
  };

  const puedeRetroceder =
    year > hoy.getFullYear() || month > hoy.getMonth();

  const celdas = [];
  for (let i = 0; i < primerDia; i++) {
    celdas.push(<div key={`e-${i}`} className={styles.calCelda} />);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const str = toDateStr(dia);
    const pasado = esPasado(str);
    const ocupado = esOcupado(str);
    const hoyDia = esHoy(str);
    const inicio = esInicio(str);
    const fin = esFin(str);
    const enRango = esEnRango(str);
    const disabled = pasado || ocupado;

    let clases = [styles.calCelda];
    if (disabled) clases.push(styles.calDisabled);
    else if (inicio || fin) clases.push(styles.calSeleccionado);
    else if (enRango) clases.push(styles.calEnRango);
    else clases.push(styles.calDisponibleDia);
    if (hoyDia) clases.push(styles.calHoy);
    if (ocupado && !pasado) clases.push(styles.calOcupado);

    celdas.push(
      <div
        key={dia}
        className={clases.join(' ')}
        onClick={() => !disabled && handleClickDia(str)}
        onMouseEnter={() => !disabled && fechaInicio && !fechaFin && setHover(str)}
        onMouseLeave={() => setHover(null)}
        title={ocupado ? 'No disponible' : pasado ? '' : str}
      >
        <span>{dia}</span>
        {ocupado && !pasado && <div className={styles.calOcupadoBar} />}
      </div>
    );
  }

  const noches = calcularNoches(fechaInicio, fechaFin);
  const total = noches * Number(precioPorNoche || 0);

  const limpiarSeleccion = () => {
    setFechaInicio(null);
    setFechaFin(null);
    onRangoChange(null, null);
  };

  return (
    <div className={styles.calendarioWrapper}>
      <div className={styles.calNav}>
        <button
          onClick={() => puedeRetroceder && setMesActual(new Date(year, month - 1, 1))}
          className={styles.calNavBtn}
          disabled={!puedeRetroceder}
        >‹</button>
        <span className={styles.calMes}>{meses[month]} {year}</span>
        <button
          onClick={() => setMesActual(new Date(year, month + 1, 1))}
          className={styles.calNavBtn}
        >›</button>
      </div>

      <div className={styles.calGrid}>
        {diasSemana.map(d => (
          <div key={d} className={styles.calDiaSemana}>{d}</div>
        ))}
        {celdas}
      </div>

      <div className={styles.calLeyenda}>
        <div className={styles.calLeyendaItem}>
          <div className={`${styles.calLeyendaDot} ${styles.dotDisponible}`} />
          <span>Disponible</span>
        </div>
        <div className={styles.calLeyendaItem}>
          <div className={`${styles.calLeyendaDot} ${styles.dotOcupado}`} />
          <span>Ocupado</span>
        </div>
        <div className={styles.calLeyendaItem}>
          <div className={`${styles.calLeyendaDot} ${styles.dotSeleccionado}`} />
          <span>Tu selección</span>
        </div>
      </div>

      {fechaInicio && !fechaFin && (
        <div className={styles.calInfo}>
          <span>📅 Seleccioná la fecha de salida</span>
          <button onClick={limpiarSeleccion} className={styles.calLimpiar}>✕</button>
        </div>
      )}

      {fechaInicio && fechaFin && (
        <div className={styles.calResumen}>
          <div className={styles.calResumenFechas}>
            <div className={styles.calResumenBloque}>
              <span className={styles.calResumenLabel}>Entrada</span>
              <span className={styles.calResumenValor}>{formatFecha(fechaInicio)}</span>
            </div>
            <div className={styles.calResumenArrow}>→</div>
            <div className={styles.calResumenBloque}>
              <span className={styles.calResumenLabel}>Salida</span>
              <span className={styles.calResumenValor}>{formatFecha(fechaFin)}</span>
            </div>
          </div>
          <div className={styles.calResumenTotal}>
            <div className={styles.calResumenCalculo}>
              <span>${precioPorNoche} × {noches} noche{noches !== 1 ? 's' : ''}</span>
              <span className={styles.calResumenPrecio}>${total.toLocaleString('es-UY')} USD</span>
            </div>
          </div>
          <button onClick={limpiarSeleccion} className={styles.calLimpiarLink}>
            Cambiar fechas
          </button>
        </div>
      )}
    </div>
  );
}

// ── Galería slider ──────────────────────────────────────────
function GaleriaSlider({ fotos, titulo }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(() => setIdx(i => (i - 1 + fotos.length) % fotos.length), [fotos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % fotos.length), [fotos.length]);

  useEffect(() => {
    if (!lightbox) return;
    const fn = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightbox, next, prev]);

  if (!fotos.length) {
    return (
      <div className={styles.galeriaPlaceholder}>
        <span>🏠</span>
        <p>Sin fotos disponibles</p>
      </div>
    );
  }

  return (
    <>
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(false)}>✕</button>
          <button
            className={`${styles.lightboxArrow} ${styles.lightboxLeft}`}
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >‹</button>
          <img
            src={fotos[idx]}
            alt={`${titulo} — foto ${idx + 1}`}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className={`${styles.lightboxArrow} ${styles.lightboxRight}`}
            onClick={(e) => { e.stopPropagation(); next(); }}
          >›</button>
          <div className={styles.lightboxCounter}>{idx + 1} / {fotos.length}</div>
        </div>
      )}

      <div className={styles.slider}>
        <div className={styles.sliderTrack}>
          <img
            src={fotos[idx]}
            alt={`${titulo} — foto ${idx + 1}`}
            className={styles.sliderImg}
            onClick={() => setLightbox(true)}
          />
        </div>

        {fotos.length > 1 && (
          <>
            <button className={`${styles.sliderArrow} ${styles.sliderLeft}`} onClick={prev}>‹</button>
            <button className={`${styles.sliderArrow} ${styles.sliderRight}`} onClick={next}>›</button>
          </>
        )}

        <div className={styles.sliderBottom}>
          <span className={styles.sliderCounter}>{idx + 1} / {fotos.length}</span>
          <button className={styles.sliderVerTodas} onClick={() => setLightbox(true)}>
            🔍 Ver en grande
          </button>
        </div>

        {fotos.length > 1 && fotos.length <= 10 && (
          <div className={styles.sliderDots}>
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`${styles.sliderDot} ${i === idx ? styles.sliderDotActive : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {fotos.length > 1 && (
        <div className={styles.thumbsRow}>
          {fotos.map((url, i) => (
            <div
              key={i}
              className={`${styles.thumb} ${i === idx ? styles.thumbActive : ''}`}
              onClick={() => setIdx(i)}
            >
              <img src={url} alt={`Miniatura ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Página principal ────────────────────────────────────────
export default function PropiedadDetalle() {
  const { id } = useParams();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await firestoreGetPublicById('propiedades', id);
        if (!data || data.estado === 'rechazada' || data.estado === 'pausada') {
          setError(true);
        } else {
          setPropiedad(data);
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'view_item', {
              item_id: id,
              item_name: data.titulo,
              item_category: data.tipoPropiedad || 'Propiedad',
              item_location: data.ubicacion,
              price: Number(data.precioPorNoche) || 0,
              currency: 'USD',
            });
          }
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

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

  const fechasOcupadas = propiedad.fechasOcupadas || [];
  const precio = Number(propiedad.precioPorNoche || 0);
  const noches = calcularNoches(fechaInicio, fechaFin);
  const total = noches * precio;

  const buildWAMsg = () => {
    let msg = `Hola! Me interesa la propiedad "${propiedad.titulo}" en ${propiedad.ubicacion}.`;
    if (fechaInicio && fechaFin) {
      msg += ` Quisiera reservar del ${formatFecha(fechaInicio)} al ${formatFecha(fechaFin)} (${noches} noche${noches !== 1 ? 's' : ''}, total estimado $${total.toLocaleString('es-UY')} USD).`;
    } else {
      msg += ' Quisiera consultar disponibilidad.';
    }
    return encodeURIComponent(msg);
  };

  return (
    <div className={styles.page}>

      <div className={styles.galeriaSection}>
        <GaleriaSlider fotos={fotos} titulo={propiedad.titulo} />
      </div>

      <div className={styles.contenido}>

        {/* Columna izquierda */}
        <div className={styles.columnaIzq}>

          <nav className={styles.breadcrumb}>
            <Link href="/">Inicio</Link>
            <span>›</span>
            <Link href="/#propiedades">Propiedades</Link>
            <span>›</span>
            <span>{propiedad.titulo}</span>
          </nav>

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

          <div className={styles.capacidadGrid}>
            {[
              { icon: '👥', label: 'Huéspedes', value: propiedad.huespedes },
              { icon: '🛏️', label: 'Dormitorios', value: propiedad.dormitorios },
              { icon: '🛌', label: 'Camas', value: propiedad.camas },
              { icon: '🚿', label: 'Baños', value: propiedad.banos },
            ].filter(i => i.value).map(item => (
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

          {propiedad.descripcion && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Sobre esta propiedad</h2>
              <p className={styles.descripcion}>{propiedad.descripcion}</p>
            </div>
          )}

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

          <div className={styles.seccion}>
            <h2 className={styles.seccionTitulo}>Información adicional</h2>
            <div className={styles.infoGrid}>
              {propiedad.tipoPropiedad && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tipo</span>
                  <span className={styles.infoValue}>{propiedad.tipoPropiedad}</span>
                </div>
              )}
              {propiedad.temporada && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Temporada</span>
                  <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                    {propiedad.temporada}
                  </span>
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

        {/* Columna derecha fija */}
        <div className={styles.columnaDer}>
          <div className={styles.reservaCard}>

            <div className={styles.reservaPrecio}>
              <span className={styles.reservaPrecioValor}>${precio}</span>
              <span className={styles.reservaPrecioLabel}> USD / noche</span>
            </div>

            <div className={styles.reservaCapacidad}>
              <span>👥 {propiedad.huespedes} huéspedes</span>
              <span>·</span>
              <span>🛏️ {propiedad.dormitorios} dorm.</span>
              <span>·</span>
              <span>🚿 {propiedad.banos} baños</span>
            </div>

            <hr className={styles.reservaDivider} />

            <p className={styles.calInstruccion}>
              Seleccioná las fechas para ver el precio total:
            </p>

            <CalendarioReserva
              fechasOcupadas={fechasOcupadas}
              precioPorNoche={precio}
              onRangoChange={(ini, fin) => {
                setFechaInicio(ini);
                setFechaFin(fin);
              }}
            />

            <hr className={styles.reservaDivider} />

            {fechaInicio && fechaFin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <BtnPagar
                  propiedad={propiedad}
                  fechaInicio={fechaInicio}
                  fechaFin={fechaFin}
                  noches={noches}
                  total={total}
                />
                <a
                  href={`https://wa.me/59895532294?text=${buildWAMsg()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: 'white',
                    color: '#25D366',
                    border: '2px solid #25D366',
                    textAlign: 'center',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                  }}
                >
                  💬 Consultar por WhatsApp
                </a>
              </div>
            ) : (
              <a
                href={`https://wa.me/59895532294?text=${buildWAMsg()}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnReserva}
                style={{ marginBottom: '1rem' }}
              >
                💬 Seleccioná fechas para reservar
              </a>
            )}

            <div className={styles.reservaGestionado}>
              <span>🏆</span>
              <div>
                <strong>Gestionado por Alquilala</strong>
                <p>Atención profesional, check-in y limpieza incluidos</p>
              </div>
            </div>

          </div>

          <Link href="/#propiedades" className={styles.btnVolver}>
            ← Ver más propiedades
          </Link>
        </div>

      </div>
    </div>
  );
}