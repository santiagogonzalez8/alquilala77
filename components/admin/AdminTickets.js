'use client';

import { useState } from 'react';
import { firestoreUpdate, firestoreDelete } from '@/lib/firebase';
import styles from '../../app/admin/admin.module.css';

export default function AdminTickets({ tickets, onRefresh }) {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [expandido, setExpandido] = useState(null);

  const filtrados = tickets
    .filter(t => filtroEstado === 'todos' || t.estado === filtroEstado)
    .sort((a, b) => {
      const orden = { pendiente: 0, 'en-proceso': 1, resuelto: 2 };
      return (orden[a.estado] || 0) - (orden[b.estado] || 0);
    });

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await firestoreUpdate('tickets-soporte', id, { estado: nuevoEstado });
      onRefresh();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este ticket?')) return;
    try {
      await firestoreDelete('tickets-soporte', id);
      onRefresh();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'resuelto': return styles.badgeGreen;
      case 'en-proceso': return styles.badgeBlue;
      case 'pendiente': return styles.badgeYellow;
      default: return styles.badgeGray;
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>💬 Tickets de Soporte ({filtrados.length})</h2>
        <div className={styles.filterBar}>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.filterSelect}>
            <option value="todos">Todos</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="en-proceso">🔵 En proceso</option>
            <option value="resuelto">✅ Resuelto</option>
          </select>
        </div>
      </div>

      <div className={styles.panelBody}>
        {filtrados.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>No hay tickets</h3>
            <p>No se encontraron tickets con este filtro.</p>
          </div>
        ) : (
          filtrados.map(ticket => (
            <div key={ticket.id}>
              <div
                className={styles.itemCard}
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandido(expandido === ticket.id ? null : ticket.id)}
              >
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{ticket.nombre}</h3>
                  <p className={styles.itemDetail}>📧 {ticket.email}</p>
                  <p className={styles.itemDetail}>📋 {ticket.asunto || 'Sin asunto'}</p>
                  <p className={styles.itemDetail} style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px'
                  }}>
                    💬 {ticket.mensaje}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem' }}>
                    <span className={`${styles.badge} ${getBadgeClass(ticket.estado)}`}>{ticket.estado}</span>
                    {ticket.fecha && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        📅 {new Date(ticket.fecha).toLocaleDateString('es-UY')}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                  <select value={ticket.estado} onChange={(e) => cambiarEstado(ticket.id, e.target.value)} className={styles.selectEstado}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en-proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                  <button onClick={() => eliminar(ticket.id)} className={styles.btnDanger}>🗑️</button>
                </div>
              </div>

              {expandido === ticket.id && (
                <div style={{
                  background: '#f8f9fa', padding: '1.25rem',
                  marginTop: '-0.75rem', marginBottom: '0.75rem',
                  borderRadius: '0 0 8px 8px',
                  border: '1px solid var(--color-border-light)', borderTop: 'none'
                }}>
                  <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Mensaje completo:</strong>
                  <div className={styles.ticketMessage} style={{ marginTop: '0.5rem' }}>
                    {ticket.mensaje}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <a
                      href={`mailto:${ticket.email}?subject=Re: ${ticket.asunto || 'Tu consulta en Alquilala'}`}
                      className={styles.btnPrimary}
                    >
                      📧 Responder por email
                    </a>
                    <a
                      href={`https://wa.me/?text=Hola ${ticket.nombre}! Respecto a tu consulta en Alquilala...`}
                      target="_blank" rel="noopener noreferrer"
                      className={styles.btnAccent}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}