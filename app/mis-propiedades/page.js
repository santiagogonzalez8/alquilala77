'use client';

import { useEffect, useState } from 'react';
import { auth, firestoreGetAll, firestoreDelete } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './mispropiedades.module.css';

function MisPropiedadesContenido() {
  const [propiedades, setPropiedades] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      await cargarMisPropiedades(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let resultado = propiedades;
    if (busqueda.trim()) {
      resultado = resultado.filter(p =>
        p.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.ubicacion?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }
    setFiltradas(resultado);
  }, [busqueda, filtroEstado, propiedades]);

  const cargarMisPropiedades = async (uid) => {
    try {
      const data = await firestoreGetAll('propiedades', [
        { field: 'userId', op: 'EQUAL', value: uid }
      ]);
      setPropiedades(data);
      setFiltradas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarPropiedad = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad? Esta acción no se puede deshacer.')) return;
    try {
      await firestoreDelete('propiedades', id);
      const user = auth.currentUser;
      if (user) await cargarMisPropiedades(user.uid);
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'disponible': return { label: '✅ Activa', class: styles.badgeGreen, desc: 'Tu propiedad está publicada y visible' };
      case 'pendiente': return { label: '⏳ En revisión', class: styles.badgeYellow, desc: 'Nuestro equipo está revisando tu publicación' };
      case 'pausada': return { label: '⏸️ Pausada', class: styles.badgeBlue, desc: 'Tu propiedad está temporalmente fuera de línea' };
      case 'rechazada': return { label: '❌ Rechazada', class: styles.badgeRed, desc: 'Revisá los datos y volvé a publicar' };
      default: return { label: estado || 'Sin estado', class: styles.badgeGray, desc: '' };
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <span className="section-label">Mi cuenta</span>
            <h1 className={styles.headerTitle}>Mis Propiedades</h1>
            <p className={styles.headerSubtitle}>
              {propiedades.length} {propiedades.length === 1 ? 'propiedad publicada' : 'propiedades publicadas'}
            </p>
          </div>
          <Link href="/publicar" className={styles.headerBtn}>
            ➕ Publicar nueva
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        {propiedades.length > 0 && (
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="🔍 Buscar por título o ubicación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.filterInput}
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">✅ Activas</option>
              <option value="pendiente">⏳ En revisión</option>
              <option value="pausada">⏸️ Pausadas</option>
              <option value="rechazada">❌ Rechazadas</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyState}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>Cargando tus propiedades...</p>
          </div>
        ) : propiedades.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏖️</div>
            <h3>No tenés propiedades publicadas</h3>
            <p>Publicá tu primera propiedad y nosotros nos encargamos de gestionarla integralmente.</p>
            <Link href="/publicar" className={styles.ctaBtn}>
              Publicar mi propiedad
            </Link>
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron propiedades con esos filtros.</p>
            <button onClick={() => { setBusqueda(''); setFiltroEstado('todos'); }} className={styles.btnLink}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtradas.map(prop => {
              const estadoInfo = getEstadoInfo(prop.estado);
              return (
                <div key={prop.id} className={styles.card}>
                  <div
                    className={styles.cardImage}
                    style={{
                      backgroundImage: (prop.imagenes?.[0] || prop.fotoPrincipal)
                        ? `url(${prop.imagenes?.[0] || prop.fotoPrincipal})`
                        : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
                    }}
                  >
                    <span className={`${styles.badge} ${estadoInfo.class}`}>
                      {estadoInfo.label}
                    </span>
                    {prop.tipoPropiedad && (
                      <span className={styles.typeBadge}>{prop.tipoPropiedad}</span>
                    )}
                    {prop.imagenes?.length > 1 && (
                      <span className={styles.photosCount}>📷 {prop.imagenes.length}</span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{prop.titulo}</h3>
                    <p className={styles.cardLocation}>📍 {prop.ubicacion}</p>

                    <div className={styles.cardDetails}>
                      <span>👥 {prop.huespedes}</span>
                      <span>🛏️ {prop.dormitorios}</span>
                      <span>🚿 {prop.banos}</span>
                    </div>

                    {prop.amenities?.length > 0 && (
                      <div className={styles.amenitiesPreview}>
                        {prop.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} className={styles.amenityTag}>{a}</span>
                        ))}
                        {prop.amenities.length > 3 && (
                          <span className={styles.amenityTag}>+{prop.amenities.length - 3}</span>
                        )}
                      </div>
                    )}

                    <p className={styles.estadoDesc}>{estadoInfo.desc}</p>

                    <div className={styles.cardFooter}>
                      <div className={styles.cardPrice}>
                        <span className={styles.priceValue}>${prop.precioPorNoche}</span>
                        <span className={styles.priceLabel}>/noche</span>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          onClick={() => setExpandido(expandido === prop.id ? null : prop.id)}
                          className={styles.btnOutline}
                        >
                          {expandido === prop.id ? 'Cerrar' : 'Detalles'}
                        </button>
                        <button onClick={() => eliminarPropiedad(prop.id)} className={styles.btnDeleteSmall}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandido === prop.id && (
                    <div className={styles.cardExpanded}>
                      {prop.descripcion && (
                        <div className={styles.expandedSection}>
                          <strong>Descripción:</strong>
                          <p>{prop.descripcion}</p>
                        </div>
                      )}
                      {prop.imagenes?.length > 1 && (
                        <div className={styles.expandedSection}>
                          <strong>Fotos ({prop.imagenes.length}):</strong>
                          <div className={styles.expandedPhotos}>
                            {prop.imagenes.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Foto ${i + 1}`} className={styles.expandedPhoto} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className={styles.expandedSection}>
                        <strong>Fecha de publicación:</strong>
                        <p>{prop.fechaPublicacion
                          ? new Date(prop.fechaPublicacion).toLocaleDateString('es-UY', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })
                          : 'N/A'}
                        </p>
                      </div>
                      {prop.fechasOcupadas?.length > 0 && (
                        <div className={styles.expandedSection}>
                          <strong>Fechas ocupadas:</strong>
                          <p>{prop.fechasOcupadas.length} días marcados como ocupados</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MisPropiedades() {
  return (
    <ProtectedRoute>
      <MisPropiedadesContenido />
    </ProtectedRoute>
  );
}