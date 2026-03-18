'use client';

import { useState } from 'react';
import { firestoreAdd, firestoreUpdate, firestoreDelete } from '@/lib/firebase';
import styles from '../../app/admin/admin.module.css';

export default function AdminTareas({ tareas, propiedades, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
  const [cargando, setCargando] = useState(null); // id de tarea en proceso
  const [toast, setToast] = useState('');
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '', tipo: 'limpieza', propiedadId: '',
    prioridad: 'media', descripcion: '', fechaLimite: ''
  });

  const tipos = {
    limpieza: '🧹 Limpieza',
    mantenimiento: '🔧 Mantenimiento',
    cortapasto: '🌿 Cortapasto',
    reparacion: '🛠️ Reparación',
    otro: '📦 Otro'
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const filtradas = tareas.filter(t => {
    if (filtroEstado === 'pendientes') return t.estado !== 'completada';
    if (filtroEstado === 'completadas') return t.estado === 'completada';
    return true;
  }).sort((a, b) => {
    const orden = { alta: 0, media: 1, baja: 2 };
    return (orden[a.prioridad] || 1) - (orden[b.prioridad] || 1);
  });

  const crearTarea = async (e) => {
    e.preventDefault();
    const propNombre = propiedades.find(p => p.id === nuevaTarea.propiedadId)?.titulo || '';
    try {
      await firestoreAdd('tareas', {
        ...nuevaTarea,
        propiedadNombre: propNombre,
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(),
      });
      setShowModal(false);
      setNuevaTarea({ titulo: '', tipo: 'limpieza', propiedadId: '', prioridad: 'media', descripcion: '', fechaLimite: '' });
      showToast('✅ Tarea creada correctamente');
      onRefresh();
    } catch (error) {
      showToast('❌ Error al crear tarea: ' + error.message);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    setCargando(id);
    try {
      await firestoreUpdate('tareas', id, {
        estado: nuevoEstado,
        ...(nuevoEstado === 'completada' ? { fechaCompletada: new Date().toISOString() } : {})
      });
      showToast(nuevoEstado === 'completada' ? '✅ Tarea completada' : '🔄 Estado actualizado');
      onRefresh();
    } catch (error) {
      showToast('❌ Error al actualizar: ' + error.message);
    } finally {
      setCargando(null);
    }
  };

  const eliminarTarea = async (id, titulo) => {
    if (!confirm(`¿Eliminar la tarea "${titulo}"?\n\nEsta acción no se puede deshacer.`)) return;
    setCargando(id);
    try {
      await firestoreDelete('tareas', id);
      showToast('🗑️ Tarea eliminada');
      onRefresh();
    } catch (error) {
      showToast('❌ Error al eliminar: ' + error.message);
    } finally {
      setCargando(null);
    }
  };

  const getPriorityClass = (prioridad) => {
    switch (prioridad) {
      case 'alta': return styles.priorityHigh;
      case 'media': return styles.priorityMedium;
      case 'baja': return styles.priorityLow;
      default: return '';
    }
  };

  const formatFecha = (str) => {
    if (!str) return null;
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const vencida = str < hoy;
      return { texto: str, vencida };
    } catch { return null; }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: toast.startsWith('❌') ? '#c62828' : 'var(--color-primary)',
          color: 'white', padding: '0.875rem 1.5rem',
          borderRadius: '8px', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '0.9rem',
        }}>
          {toast}
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>🧹 Gestión de Tareas ({filtradas.length})</h2>
          <div className={styles.filterBar}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.filterSelect}>
              <option value="pendientes">⏳ Pendientes</option>
              <option value="completadas">✅ Completadas</option>
              <option value="todas">📋 Todas</option>
            </select>
            <button onClick={() => setShowModal(true)} className={styles.btnAccent}>
              ➕ Nueva tarea
            </button>
          </div>
        </div>

        <div className={styles.panelBody}>
          {filtradas.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>{filtroEstado === 'completadas' ? '📋' : '✅'}</div>
              <h3>{filtroEstado === 'completadas' ? 'No hay tareas completadas' : '¡Todo al día!'}</h3>
              <p>No hay tareas {filtroEstado === 'pendientes' ? 'pendientes' : 'en esta categoría'}.</p>
              {filtroEstado === 'pendientes' && (
                <button onClick={() => setShowModal(true)} className={styles.btnAccent} style={{ marginTop: '1rem' }}>
                  ➕ Crear primera tarea
                </button>
              )}
            </div>
          ) : (
            filtradas.map(tarea => {
              const fechaInfo = formatFecha(tarea.fechaLimite);
              const enCarga = cargando === tarea.id;
              return (
                <div
                  key={tarea.id}
                  className={`${styles.itemCard} ${getPriorityClass(tarea.prioridad)}`}
                  style={{ opacity: enCarga ? 0.6 : 1, transition: 'opacity 0.2s' }}
                >
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemTitle}>
                      {tipos[tarea.tipo]?.split(' ')[0]} {tarea.titulo}
                    </h3>
                    {tarea.propiedadNombre && (
                      <p className={styles.itemDetail}>🏠 {tarea.propiedadNombre}</p>
                    )}
                    {tarea.descripcion && (
                      <p className={styles.itemDetail}>{tarea.descripcion}</p>
                    )}
                    {fechaInfo && (
                      <p className={styles.itemDetail} style={{ color: fechaInfo.vencida && tarea.estado !== 'completada' ? '#c62828' : 'inherit', fontWeight: fechaInfo.vencida && tarea.estado !== 'completada' ? 700 : 'normal' }}>
                        📅 Límite: {fechaInfo.texto}
                        {fechaInfo.vencida && tarea.estado !== 'completada' && ' ⚠️ Vencida'}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <span className={`${styles.badge} ${tarea.prioridad === 'alta' ? styles.badgeRed : tarea.prioridad === 'media' ? styles.badgeYellow : styles.badgeBlue}`}>
                        {tarea.prioridad === 'alta' ? '🔴' : tarea.prioridad === 'media' ? '🟡' : '🔵'} {tarea.prioridad}
                      </span>
                      <span className={`${styles.badge} ${tarea.estado === 'completada' ? styles.badgeGreen : tarea.estado === 'en-proceso' ? styles.badgeBlue : styles.badgeYellow}`}>
                        {tarea.estado}
                      </span>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <select
                      value={tarea.estado}
                      onChange={(e) => cambiarEstado(tarea.id, e.target.value)}
                      className={styles.selectEstado}
                      disabled={enCarga}
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en-proceso">🔵 En proceso</option>
                      <option value="completada">✅ Completada</option>
                    </select>
                    <button
                      onClick={() => eliminarTarea(tarea.id, tarea.titulo)}
                      className={styles.btnDanger}
                      disabled={enCarga}
                    >
                      {enCarga ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal nueva tarea */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Nueva Tarea</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={crearTarea}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Título *</label>
                  <input
                    type="text"
                    required
                    value={nuevaTarea.titulo}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                    placeholder="Ej: Limpieza post check-out"
                    autoFocus
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tipo</label>
                    <select value={nuevaTarea.tipo} onChange={(e) => setNuevaTarea({ ...nuevaTarea, tipo: e.target.value })}>
                      {Object.entries(tipos).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Prioridad</label>
                    <select value={nuevaTarea.prioridad} onChange={(e) => setNuevaTarea({ ...nuevaTarea, prioridad: e.target.value })}>
                      <option value="baja">🔵 Baja</option>
                      <option value="media">🟡 Media</option>
                      <option value="alta">🔴 Alta</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Propiedad</label>
                  <select value={nuevaTarea.propiedadId} onChange={(e) => setNuevaTarea({ ...nuevaTarea, propiedadId: e.target.value })}>
                    <option value="">— General (sin propiedad) —</option>
                    {propiedades.map(p => (
                      <option key={p.id} value={p.id}>{p.titulo}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha límite</label>
                  <input
                    type="date"
                    value={nuevaTarea.fechaLimite}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaLimite: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    rows="3"
                    value={nuevaTarea.descripcion}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                    placeholder="Detalles adicionales..."
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnOutline}>Cancelar</button>
                <button type="submit" className={styles.btnAccent}>✅ Crear tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}