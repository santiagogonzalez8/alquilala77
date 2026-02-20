'use client';

import { useEffect, useState } from 'react';
import { auth, firestoreGetAll } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './mipanel.module.css';

function MiPanelContenido() {
  const router = useRouter();
  const [propiedades, setPropiedades] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const [props, revs] = await Promise.all([
          firestoreGetAll('propiedades', [
            { field: 'userId', op: 'EQUAL', value: user.uid }
          ]),
          firestoreGetAll('reservas', [
            { field: 'userId', op: 'EQUAL', value: user.uid }
          ]),
        ]);
        setPropiedades(props);
        setReservas(revs);
      } catch (error) {
        console.error('Error cargando mi-panel:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const propActivas       = propiedades.filter(p => p.estado === 'disponible').length;
  const propPendientes    = propiedades.filter(p => p.estado === 'pendiente').length;
  const propRechazadas    = propiedades.filter(p => p.estado === 'rechazada').length;
  const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  const ingresoEstimado   = reservas
    .filter(r => r.estado === 'confirmada')
    .reduce((sum, r) => sum + (Number(r.precioTotal) || 0), 0);

  const formatMonto = (n) =>
    n.toLocaleString('es-UY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>Cargando tu panel...</h1>
          </div>
        </div>
        <div className={styles.content}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          </div>
        </div>
      </div>
    );
  }

  const nombre = auth.currentUser?.displayName?.split(' ')[0] || 'propietario';

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'disponible': return styles.statusGreen;
      case 'pendiente':  return styles.statusYellow;
      case 'pausada':    return styles.statusBlue;
      default:           return styles.statusRed;
    }
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'disponible': return '✅ Activa';
      case 'pendiente':  return '⏳ En revisión';
      case 'pausada':    return '⏸️ Pausada';
      default:           return '❌ Rechazada';
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>¡Hola, {nombre}! 👋</h1>
          <p className={styles.headerSubtitle}>Este es el resumen de tu actividad en Alquilala</p>
        </div>
      </div>

      <div className={styles.content}>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => router.push('/mis-propiedades')}>
            <div className={styles.statIcon}>🏠</div>
            <div>
              <p className={styles.statLabel}>Propiedades activas</p>
              <p className={styles.statValue}>{propActivas}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div>
              <p className={styles.statLabel}>En revisión</p>
              <p className={styles.statValue}>{propPendientes}</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => router.push('/mis-reservas')}>
            <div className={styles.statIcon}>📅</div>
            <div>
              <p className={styles.statLabel}>Reservas confirmadas</p>
              <p className={styles.statValue}>{reservasConfirmadas}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div>
              <p className={styles.statLabel}>Ingresos estimados</p>
              <p className={styles.statValue}>
                {ingresoEstimado > 0 ? formatMonto(ingresoEstimado) : '$0'}
              </p>
            </div>
          </div>
        </div>

        {/* Alerta propiedades rechazadas */}
        {propRechazadas > 0 && (
          <div className={styles.alertBox}>
            <span>⚠️</span>
            <div>
              <strong>
                Tenés {propRechazadas}{' '}
                {propRechazadas === 1 ? 'propiedad rechazada' : 'propiedades rechazadas'}
              </strong>
              <p>Revisá los motivos y volvé a publicar con los ajustes necesarios.</p>
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Acciones rápidas</h2>
          <div className={styles.actionsGrid}>
            <Link href="/publicar" className={styles.actionCard}>
              <span className={styles.actionIcon}>➕</span>
              <span className={styles.actionLabel}>Publicar nueva propiedad</span>
            </Link>
            <Link href="/mis-propiedades" className={styles.actionCard}>
              <span className={styles.actionIcon}>🏠</span>
              <span className={styles.actionLabel}>Ver mis propiedades</span>
            </Link>
            <Link href="/mis-reservas" className={styles.actionCard}>
              <span className={styles.actionIcon}>📅</span>
              <span className={styles.actionLabel}>Ver mis reservas</span>
            </Link>
            <Link href="/soporte" className={styles.actionCard}>
              <span className={styles.actionIcon}>💬</span>
              <span className={styles.actionLabel}>Contactar soporte</span>
            </Link>
          </div>
        </div>

        {/* Lista de propiedades */}
        {propiedades.length > 0 ? (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Estado de mis propiedades</h2>
              <Link href="/mis-propiedades" className={styles.verTodo}>Ver todas →</Link>
            </div>
            <div className={styles.propList}>
              {propiedades.slice(0, 5).map(prop => (
                <div key={prop.id} className={styles.propItem}>
                  <div className={styles.propThumb}>
                    {(prop.imagenes?.[0] || prop.fotoPrincipal) ? (
                      <img src={prop.imagenes?.[0] || prop.fotoPrincipal} alt="" />
                    ) : (
                      <div className={styles.propThumbPlaceholder}>🏠</div>
                    )}
                  </div>
                  <div className={styles.propInfo}>
                    <h3 className={styles.propName}>{prop.titulo}</h3>
                    <p className={styles.propLocation}>📍 {prop.ubicacion}</p>
                  </div>
                  <div className={styles.propStatus}>
                    <span className={`${styles.statusBadge} ${getStatusClass(prop.estado)}`}>
                      {getStatusLabel(prop.estado)}
                    </span>
                    <span className={styles.propPrice}>${prop.precioPorNoche}/noche</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty state — primera vez */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏖️</div>
            <h3>¡Empezá a generar ingresos!</h3>
            <p>Publicá tu primera propiedad y nosotros nos encargamos de todo.</p>
            <Link href="/publicar" className={styles.ctaBtn}>
              Publicar mi propiedad
            </Link>
          </div>
        )}

        {/* Cómo funciona el proceso */}
        <div className={styles.infoBox}>
          <h3>🔔 ¿Cómo funciona el proceso?</h3>
          <div className={styles.infoSteps}>
            <div className={styles.infoStep}>
              <span className={styles.stepNumber}>1</span>
              <p>Publicás tu propiedad con fotos y datos</p>
            </div>
            <div className={styles.infoStep}>
              <span className={styles.stepNumber}>2</span>
              <p>Nuestro equipo la revisa y aprueba</p>
            </div>
            <div className={styles.infoStep}>
              <span className={styles.stepNumber}>3</span>
              <p>La publicamos en Airbnb, Booking y MercadoLibre</p>
            </div>
            <div className={styles.infoStep}>
              <span className={styles.stepNumber}>4</span>
              <p>Gestionamos reservas, limpieza y huéspedes</p>
            </div>
          </div>
        </div>

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