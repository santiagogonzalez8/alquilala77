'use client';

import { useEffect, useState } from 'react';
import { auth, firestoreGetAll } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './mipanel.module.css';

function calcularNoches(desde, hasta) {
  if (!desde || !hasta) return 0;
  const d1 = new Date(desde);
  const d2 = new Date(hasta);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : 0;
}

function formatMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString('es-UY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function MiPanelContenido() {
  const [user, setUser] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState('este_mes');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      await cargar(u);
    });
    return () => unsub();
  }, []);

  const cargar = async (u) => {
    try {
      const [props, revs] = await Promise.all([
        firestoreGetAll('propiedades', [
          { field: 'userId', op: 'EQUAL', value: u.uid }
        ]),
        firestoreGetAll('reservas', [
          { field: 'userEmail', op: 'EQUAL', value: u.email }
        ]),
      ]);
      setPropiedades(props);
      setReservas(revs);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar reservas por periodo
  const getFechaDesde = () => {
    const hoy = new Date();
    switch (periodoFiltro) {
      case 'este_mes':
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      case 'mes_anterior':
        return new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      case 'este_anio':
        return new Date(hoy.getFullYear(), 0, 1);
      case 'todo':
        return new Date(2020, 0, 1);
      default:
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }
  };

  const getFechaHasta = () => {
    const hoy = new Date();
    switch (periodoFiltro) {
      case 'mes_anterior':
        return new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      default:
        return hoy;
    }
  };

  const reservasFiltradas = reservas.filter(r => {
    if (!r.fechaReserva && !r.fechaCheckIn) return true;
    const fecha = new Date(r.fechaReserva || r.fechaCheckIn);
    return fecha >= getFechaDesde() && fecha <= getFechaHasta();
  });

  const reservasConfirmadas = reservasFiltradas.filter(r => r.estado === 'confirmada');
  const reservasPendientes = reservasFiltradas.filter(r => r.estado === 'pendiente');

  const ingresosBrutos = reservasConfirmadas.reduce(
    (sum, r) => sum + (Number(r.precioTotal) || 0), 0
  );

  // Comisión Alquilala 15%
  const COMISION = 0.15;
  const ingresosNetos = ingresosBrutos * (1 - COMISION);
  const comisionAlquilala = ingresosBrutos * COMISION;

  const propiedadesActivas = propiedades.filter(p => p.estado === 'disponible');
  const propiedadesPendientes = propiedades.filter(p => p.estado === 'pendiente');

  // Calcular tasa de ocupación del mes actual
  const hoy = new Date();
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasOcupados = reservasConfirmadas.reduce((sum, r) => {
    return sum + calcularNoches(r.fechaCheckIn, r.fechaCheckOut);
  }, 0);
  const tasaOcupacion = propiedadesActivas.length > 0
    ? Math.min(100, Math.round((diasOcupados / (diasEnMes * propiedadesActivas.length)) * 100))
    : 0;

  // Ingreso promedio por noche
  const totalNoches = reservasConfirmadas.reduce(
    (sum, r) => sum + calcularNoches(r.fechaCheckIn, r.fechaCheckOut), 0
  );
  const ingresoPorNoche = totalNoches > 0 ? Math.round(ingresosBrutos / totalNoches) : 0;

  // Próximas reservas
  const proximasReservas = reservas
    .filter(r => {
      if (!r.fechaCheckIn) return false;
      return new Date(r.fechaCheckIn) >= hoy;
    })
    .sort((a, b) => new Date(a.fechaCheckIn) - new Date(b.fechaCheckIn))
    .slice(0, 5);

  const formatFecha = (str) => {
    if (!str) return '—';
    try {
      return new Date(str).toLocaleDateString('es-UY', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return str; }
  };

  const getNombrePropiedad = (propiedadId) => {
    const prop = propiedades.find(p => p.id === propiedadId);
    return prop?.titulo || 'Propiedad';
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className="loading-spinner" />
        <p>Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <span className="section-label">Mi cuenta</span>
            <h1 className={styles.headerTitle}>
              Bienvenido, {user?.displayName?.split(' ')[0] || 'propietario'} 👋
            </h1>
            <p className={styles.headerSubtitle}>
              Este es el resumen de tu actividad en Alquilala
            </p>
          </div>

          {/* Selector de periodo */}
          <select
            value={periodoFiltro}
            onChange={e => setPeriodoFiltro(e.target.value)}
            className={styles.periodoSelect}
          >
            <option value="este_mes">Este mes</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="este_anio">Este año</option>
            <option value="todo">Todo el tiempo</option>
          </select>
        </div>
      </div>

      <div className={styles.content}>

        {/* Stats cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏠</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Propiedades activas</p>
              <p className={styles.statValor}>{propiedadesActivas.length}</p>
              {propiedadesPendientes.length > 0 && (
                <p className={styles.statSub}>+{propiedadesPendientes.length} en revisión</p>
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Reservas confirmadas</p>
              <p className={styles.statValor}>{reservasConfirmadas.length}</p>
              {reservasPendientes.length > 0 && (
                <p className={styles.statSub}>{reservasPendientes.length} pendientes</p>
              )}
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardDestacado}`}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Ingresos netos</p>
              <p className={styles.statValor}>{formatMoneda(ingresosNetos)} USD</p>
              <p className={styles.statSub}>
                Bruto: {formatMoneda(ingresosBrutos)} USD
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Tasa de ocupación</p>
              <p className={styles.statValor}>{tasaOcupacion}%</p>
              <p className={styles.statSub}>{ingresoPorNoche > 0 ? `$${ingresoPorNoche} USD/noche promedio` : 'Sin datos'}</p>
            </div>
          </div>
        </div>

        {/* Layout 2 columnas */}
        <div className={styles.mainGrid}>

          {/* Columna izquierda */}
          <div className={styles.colLeft}>

            {/* Desglose de ingresos */}
            {ingresosBrutos > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitulo}>💰 Desglose de ingresos</h3>
                <div className={styles.desgloseList}>
                  <div className={styles.desgloseRow}>
                    <span>Ingresos brutos</span>
                    <span className={styles.desgloseValor}>{formatMoneda(ingresosBrutos)} USD</span>
                  </div>
                  <div className={`${styles.desgloseRow} ${styles.desgloseNegativo}`}>
                    <span>Comisión Alquilala (15%)</span>
                    <span>- {formatMoneda(comisionAlquilala)} USD</span>
                  </div>
                  <div className={`${styles.desgloseRow} ${styles.desgloseTotal}`}>
                    <span>💵 Tu ganancia neta</span>
                    <span>{formatMoneda(ingresosNetos)} USD</span>
                  </div>
                </div>
                <p className={styles.desgloseNota}>
                  * La comisión incluye gestión completa: publicación en Airbnb y Booking,
                  atención al huésped 24/7, limpieza y mantenimiento.
                </p>
              </div>
            )}

            {/* Mis propiedades */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitulo}>🏠 Mis propiedades</h3>
                <Link href="/publicar" className={styles.cardBtn}>
                  + Publicar nueva
                </Link>
              </div>

              {propiedades.length === 0 ? (
                <div className={styles.emptyCard}>
                  <div className={styles.emptyCardIcon}>🏖️</div>
                  <h4>¡Empezá a generar ingresos!</h4>
                  <p>Publicá tu primera propiedad y nosotros nos encargamos de todo.</p>
                  <Link href="/publicar" className={styles.ctaBtn}>
                    Publicar mi propiedad
                  </Link>
                </div>
              ) : (
                <div className={styles.propList}>
                  {propiedades.map(prop => {
                    const reservasProp = reservasConfirmadas.filter(
                      r => r.propiedadId === prop.id
                    );
                    const ingresosProp = reservasProp.reduce(
                      (sum, r) => sum + (Number(r.precioTotal) || 0), 0
                    );

                    return (
                      <div key={prop.id} className={styles.propItem}>
                        <div
                          className={styles.propImg}
                          style={{
                            backgroundImage: (prop.imagenes?.[0] || prop.fotoPrincipal)
                              ? `url(${prop.imagenes?.[0] || prop.fotoPrincipal})`
                              : 'linear-gradient(135deg, #1e3a5f, #2d4a6f)'
                          }}
                        />
                        <div className={styles.propInfo}>
                          <p className={styles.propNombre}>{prop.titulo}</p>
                          <p className={styles.propUbicacion}>📍 {prop.ubicacion}</p>
                          <div className={styles.propMeta}>
                            <span className={`${styles.propEstado} ${
                              prop.estado === 'disponible' ? styles.estadoVerde :
                              prop.estado === 'pendiente' ? styles.estadoAmarillo :
                              styles.estadoGris
                            }`}>
                              {prop.estado === 'disponible' ? '✅ Activa' :
                               prop.estado === 'pendiente' ? '⏳ En revisión' :
                               prop.estado}
                            </span>
                            {ingresosProp > 0 && (
                              <span className={styles.propIngresos}>
                                {formatMoneda(ingresosProp * (1 - COMISION))} netos
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.propPrecios}>
                          {prop.precioAlta ? (
                            <>
                              <p className={styles.precioTemporada}>
                                <span style={{ color: '#ef4444' }}>●</span> Alta: ${prop.precioAlta}
                              </p>
                              <p className={styles.precioTemporada}>
                                <span style={{ color: '#f59e0b' }}>●</span> Media: ${prop.precioMedia || prop.precioPorNoche}
                              </p>
                              <p className={styles.precioTemporada}>
                                <span style={{ color: '#22c55e' }}>●</span> Baja: ${prop.precioBaja || prop.precioPorNoche}
                              </p>
                            </>
                          ) : (
                            <p className={styles.precioBase}>${prop.precioPorNoche}/noche</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Columna derecha */}
          <div className={styles.colRight}>

            {/* Próximas reservas */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitulo}>📅 Próximas reservas</h3>
                <Link href="/mis-reservas" className={styles.cardBtn}>
                  Ver todas
                </Link>
              </div>

              {proximasReservas.length === 0 ? (
                <div className={styles.emptyCard}>
                  <p>No tenés reservas próximas.</p>
                </div>
              ) : (
                <div className={styles.reservasList}>
                  {proximasReservas.map(r => (
                    <div key={r.id} className={styles.reservaItem}>
                      <div className={styles.reservaFechas}>
                        <p className={styles.reservaCheckIn}>
                          {formatFecha(r.fechaCheckIn)}
                        </p>
                        <span className={styles.reservaArrow}>→</span>
                        <p className={styles.reservaCheckOut}>
                          {formatFecha(r.fechaCheckOut)}
                        </p>
                      </div>
                      <p className={styles.reservaProp}>
                        🏠 {getNombrePropiedad(r.propiedadId)}
                      </p>
                      <div className={styles.reservaMeta}>
                        {r.noches && (
                          <span className={styles.reservaNoches}>
                            🌙 {r.noches} noches
                          </span>
                        )}
                        {r.precioTotal && (
                          <span className={styles.reservaMonto}>
                            {formatMoneda(Number(r.precioTotal) * (1 - COMISION))} USD netos
                          </span>
                        )}
                      </div>
                      <span className={`${styles.reservaEstado} ${
                        r.estado === 'confirmada' ? styles.estadoVerde :
                        r.estado === 'pendiente' ? styles.estadoAmarillo :
                        styles.estadoGris
                      }`}>
                        {r.estado === 'confirmada' ? '✅ Confirmada' :
                         r.estado === 'pendiente' ? '⏳ Pendiente' : r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>⚡ Acciones rápidas</h3>
              <div className={styles.accionesGrid}>
                <Link href="/publicar" className={styles.accionBtn}>
                  <span className={styles.accionIcon}>➕</span>
                  <span>Publicar nueva propiedad</span>
                </Link>
                <Link href="/mis-propiedades" className={styles.accionBtn}>
                  <span className={styles.accionIcon}>🏠</span>
                  <span>Ver mis propiedades</span>
                </Link>
                <Link href="/mis-reservas" className={styles.accionBtn}>
                  <span className={styles.accionIcon}>📅</span>
                  <span>Ver mis reservas</span>
                </Link>
                <Link href="/soporte" className={styles.accionBtn}>
                  <span className={styles.accionIcon}>💬</span>
                  <span>Contactar soporte</span>
                </Link>
                <Link href="/perfil" className={styles.accionBtn}>
                  <span className={styles.accionIcon}>👤</span>
                  <span>Mi perfil</span>
                </Link>
                <a
                  href="https://wa.me/59895532294?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20propiedad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.accionBtn}
                >
                  <span className={styles.accionIcon}>📱</span>
                  <span>WhatsApp directo</span>
                </a>
              </div>
            </div>

            {/* Calculador de proyección */}
            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>📊 Proyección de ingresos</h3>
              <ProyeccionIngresos propiedades={propiedadesActivas} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ProyeccionIngresos({ propiedades }) {
  const [ocupacion, setOcupacion] = useState(60);
  const [meses, setMeses] = useState(12);

  if (propiedades.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Publicá una propiedad para ver la proyección.
      </p>
    );
  }

  const precioPromedio = propiedades.reduce((sum, p) => {
    const precio = Number(p.precioPorNoche || 0);
    return sum + precio;
  }, 0) / propiedades.length;

  const diasPorMes = 30 * (ocupacion / 100);
  const ingresoBrutoPorMes = precioPromedio * diasPorMes * propiedades.length;
  const ingresoNetoPorMes = ingresoBrutoPorMes * 0.85;
  const totalProyectado = ingresoNetoPorMes * meses;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)',
            display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem',
          }}>
            <span>Ocupación estimada</span>
            <span style={{ color: 'var(--color-primary)' }}>{ocupacion}%</span>
          </label>
          <input
            type="range" min="10" max="100" step="5"
            value={ocupacion}
            onChange={e => setOcupacion(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>
        <div>
          <label style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)',
            display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem',
          }}>
            <span>Periodo</span>
            <span style={{ color: 'var(--color-primary)' }}>{meses} mes{meses !== 1 ? 'es' : ''}</span>
          </label>
          <input
            type="range" min="1" max="24" step="1"
            value={meses}
            onChange={e => setMeses(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>
      </div>

      <div style={{
        background: 'var(--color-bg-warm)', borderRadius: '10px',
        padding: '1.25rem', border: '1px solid var(--color-border-light)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.875rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Por mes</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0.2rem 0 0' }}>
              ${Math.round(ingresoNetoPorMes).toLocaleString('es-UY')}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0 }}>USD netos</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              En {meses} mes{meses !== 1 ? 'es' : ''}
            </p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent)', margin: '0.2rem 0 0' }}>
              ${Math.round(totalProyectado).toLocaleString('es-UY')}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0 }}>USD netos</p>
          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
          Basado en {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} a ${Math.round(precioPromedio)}/noche promedio · Ya incluye comisión Alquilala (15%)
        </p>
      </div>
    </div>
  );
}

export default function MiPanel() {
  return (
    <ProtectedRoute>
      <MiPanelContenido />
    </ProtectedRoute>
  );
}