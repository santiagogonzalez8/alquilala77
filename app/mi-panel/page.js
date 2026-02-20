'use client';

import { useEffect, useState } from 'react';
import { auth, firestoreGetCollection } from '@/lib/firebase';
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
    const cargar = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Cargar en paralelo con REST
        const [propsData, resData] = await Promise.all([
          firestoreGetCollection('propiedades', 'userId', user.uid),
          firestoreGetCollection('reservas', 'userId', user.uid),
        ]);
        setPropiedades(propsData);
        setReservas(resData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(cargar, 100);
    return () => clearTimeout(timer);
  }, []);

  const propActivas = propiedades.filter(p => p.estado === 'disponible').length;
  const propPendientes = propiedades.filter(p => p.estado === 'pendiente').length;
  const propRechazadas = propiedades.filter(p => p.estado === 'rechazada').length;
  const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  const ingresoEstimado = reservas
    .filter(r => r.estado === 'confirmada')
    .reduce((sum, r) => sum + (Number(r.precioTotal) || 0), 0);

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
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const nombre = auth.currentUser?.displayName?.split(' ')[0] || 'propietario';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>¡Hola, {nombre}! 👋</h1>
          <p className={styles.headerSubtitle}>Este es el resumen de tu actividad en Alquilala</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => router.push('/mis-propiedades')}>
            <div className={styles.statIcon}>🏠</div>
            <div><p className={styles.statLabel}>Propiedades activas</p><p className={styles.statValue}>{propActivas}</p></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div><p className={styles.statLabel}>En revisión</p><p className={styles.statValue}>{propPendientes}</p></div>
          </div>
          <div className={styles.statCard} onClick={() => router.push('/mis-reservas')}>
            <div className={styles.statIcon}>📅</div>
            <div><p className={styles.statLabel}>Reservas confirmadas</p><p className={styles.statValue}>{reservasConfirmadas}</p></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div><p className={styles.statLabel}>Ingresos estimados</p><p className={styles.statValue}>${ingresoEstimado}</p></div>
          </div>
        </div>

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

        {propiedades.length > 0 && (
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
                    <span className={`${styles.statusBadge} ${
                      prop.estado === 'disponible' ? styles.statusGreen :
                      prop.estado === 'pendiente' ? styles.statusYellow :
                      prop.estado === 'pausada' ? styles.statusBlue : styles.statusRed
                    }`}>
                      {prop.estado === 'disponible' ? '✅ Activa' :
                       prop.estado === 'pendiente' ? '⏳ En revisión' :
                       prop.estado === 'pausada' ? '⏸️ Pausada' : '❌ Rechazada'}
                    </span>
                    <span className={styles.propPrice}>${prop.precioPorNoche}/noche</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {propiedades.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏖️</div>
            <h3>¡Empezá a generar ingresos!</h3>
            <p>Publicá tu primera propiedad y nosotros nos encargamos de todo.</p>
            <Link href="/publicar" className={styles.ctaBtn}>Publicar mi propiedad</Link>
          </div>
        )}

        {propRech