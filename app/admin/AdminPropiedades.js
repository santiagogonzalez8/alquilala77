'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import styles from '../../app/admin/admin.module.css';

export default function AdminPropiedades({ propiedades, onRefresh }) {
  const [filtro, setFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [expandido, setExpandido] = useState(null);

  const filtradas = propiedades.filter(p => {
    const matchTexto = !filtro ||
      p.titulo?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.ubicacion?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(filtro.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    return matchTexto && matchEstado;
  });

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'propiedades', id), { estado: nuevoEstado });
      onRefresh();
    } catch (error) {
      alert('Error al actualizar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta propiedad permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'propiedades', id));
      onRefresh();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'disponible': return styles.badgeGreen;
      case 'pendiente': return styles.badgeYellow;
      case 'pausada': return styles.badgeBlue;
      case 'rechazada': return styles.badgeRed;
      default: return styles.badgeGray;
    }
  };

  return (
    <>
      {/* Filtros */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>🏠 Gestión de Propiedades ({filtradas.length})</h2>
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="🔍 Buscar título, ubicación, email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={styles.filterInput}
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">✅ Disponible</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="pausada">⏸️ Pausada</option>
              <option value="rechazada">❌ Rechazada</option>
            </select>
          </div>
        </div>

        <div className={styles.panelBody}>
          {filtradas.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏠</div>
              <h3>No se encontraron propiedades</h3>
              <p>Ajustá los filtros o esperá a que los dueños publiquen.</p>
            </div>
          ) : (
            filtradas.map(prop => (
              <div key={prop.id}>
                <div
                  className={styles.itemCard}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandido(expandido === prop.id ? null : prop.id)}
                >
                  <div className={styles.itemInfo} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Thumbnail */}
                    {(prop.imagenes?.[0] || prop.fotoPrincipal) && (
                      <img
                        src={prop.imagenes?.[0] || prop.fotoPrincipal}
                        alt=""
                        className={styles.photoThumb}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className={styles.itemTitle}>{prop.titulo}</h3>
                      <p className={styles.itemDetail}>📍 {prop.ubicacion} • 💰 ${prop.precioPorNoche}/noche</p>
                      <p className={styles.itemDetail}>
                        👥 {prop.huespedes} huésp. • 🛏️ {prop.dormitorios} dorm. • 🚿 {prop.banos} baños
                      </p>
                      <p className={styles.itemDetail}>👤 {prop.userEmail}</p>
                      <span className={`${styles.badge} ${getBadgeClass(prop.estado)}`}>
                        {prop.estado || 'sin estado'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                    <select
                      value={prop.estado || 'pendiente'}
                      onChange={(e) => cambiarEstado(prop.id, e.target.value)}
                      className={styles.selectEstado}
                    >
                      <option value="disponible">✅ Disponible</option>
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="pausada">⏸️ Pausada</option>
                      <option value="rechazada">❌ Rechazada</option>
                    </select>
                    <button onClick={() => eliminar(prop.id)} className={styles.btnDanger}>
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>

                {/* Detalle expandido */}
                {expandido === prop.id && (
                  <div style={{
                    background: '#f8f9fa',
                    padding: '1.25rem',
                    marginTop: '-0.75rem',
                    marginBottom: '0.75rem',
                    borderRadius: '0 0 8px 8px',
                    border: '1px solid var(--color-border-light)',
                    borderTop: 'none'
                  }}>
                    {prop.descripcion && (
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Descripción:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginTop: '0.3rem', lineHeight: '1.6' }}>
                          {prop.descripcion}
                        </p>
                      </div>
                    )}

                    {prop.amenities?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Amenidades:</strong>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                          {prop.amenities.map((a, i) => (
                            <span key={i} style={{
                              background: 'white', border: '1px solid var(--color-border)',
                              padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'
                            }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {prop.imagenes?.length > 0 && (
                      <div>
                        <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                          Fotos ({prop.imagenes.length}):
                        </strong>
                        <div className={styles.photosRow} style={{ marginTop: '0.4rem' }}>
                          {prop.imagenes.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`Foto ${i + 1}`} className={styles.photoThumb} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      📅 Publicada: {prop.fechaPublicacion ? new Date(prop.fechaPublicacion).toLocaleDateString('es-UY') : 'N/A'}
                      {' • '} Tipo: {prop.tipoPropiedad || 'N/A'}
                      {' • '} Temporada: {prop.temporada || 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}