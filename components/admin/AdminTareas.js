'use client';

import { useState } from 'react';
import { firestoreAdd, firestoreUpdate, firestoreDelete } from '@/lib/firebase';
import styles from '../../app/admin/admin.module.css';

export default function AdminTareas({ tareas, propiedades, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
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
      onRefresh();
    } catch (error) {
      alert('Error al crear tarea: ' + error.message);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await firestoreUpdate('tareas', id, {
        estado: nuevoEstado,
        ...(nuevoEstado === 'completada' ? { fechaCompletada: new Date().toISOString() } : {})
      });
      onRefresh();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const eliminarTarea = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await firestoreDelete('tareas', id);
      onRefresh();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
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

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>🧹 Gestión de Tareas ({filtradas.length})</h2>
          <div className={styles.filterBar}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.filterSelect}>
              <option value="pendientes">Pendientes</option>
              <option value="completadas">Completadas</option>
              <option value="todas">Todas</option>
            </select>
            <button onClick={() => setShowModal(true)} className={styles.btnAccent}>
              ➕ Nueva tarea
            </button>
          </div>
        </div>

        <div className={styles.panelBody}>
          {filtradas.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✅</div>
              <h3>{filtroEstado === 'completadas' ? 'No hay tareas completadas' : '¡Todo al día!'}</h3>
              <p>No hay tareas {filtroEstado === 'pendientes' ? 'pendientes' : 'en esta categoría'}.</p>
            </div>
          ) : (
            filtradas.map(tarea => (
              <div key={tarea.id} className={`${styles.itemCard} ${getPriorityClass(tarea.prioridad)}`}>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>
                    {tipos[tarea.tipo] || '📦'} {tarea.titulo}
                  </h3>
                  {tarea.propiedadNombre && <p className={styles.itemDetail}>🏠 {tarea.propiedadNombre}</p>}
                  {tarea.descripcion && <p className={styles.itemDetail}>{tarea.descripcion}</p>}
                  {tarea.fechaLimite && <p className={styles.itemDetail}>📅 Límite: {tarea.fechaLimite}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span className={`${styles.badge} ${tarea.prioridad === 'alta' ? styles.badgeRed : tarea.prioridad === 'media' ? styles.badgeYellow : styles.badgeBlue}`}>
                      {tarea.prioridad}
                    </span>
                    <span className={`${styles.badge} ${tarea.estado === 'completada' ? styles.badgeGreen : tarea.estado === 'en-proceso' ? styles.badgeBlue : styles.badgeYellow}`}>
                      {tarea.estado}
                    </span>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <select value={tarea.estado} onChange={(e) => cambiarEstado(tarea.id, e.target.value)} className={styles.selectEstado}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en-proceso">En proceso</option>
                    <option value="completada">Completada</option>
                  </select>
                  <button onClick={() => eliminarTarea(tarea.id)} className={styles.btnDanger}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
                  <input type="text" required value={nuevaTarea.titulo}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                    placeholder="Ej: Limpieza post check-out" />
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
                  <input type="date" value={nuevaTarea.fechaLimite}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaLimite: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea rows="3" value={nuevaTarea.descripcion}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                    placeholder="Detalles adicionales..." />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnOutline}>Cancelar</button>
                <button type="submit" className={styles.btnAccent}>Crear tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}