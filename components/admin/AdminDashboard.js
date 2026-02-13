'use client';

import styles from '../../app/admin/admin.module.css';

export default function AdminDashboard({ propiedades, reservas, tickets, tareas, usuarios, onNavigate }) {
  const propDisponibles = propiedades.filter(p => p.estado === 'disponible').length;
  const propPendientes = propiedades.filter(p => p.estado === 'pendiente').length;
  const ticketsPendientes = tickets.filter(t => t.estado === 'pendiente').length;
  const tareasPendientes = tareas.filter(t => t.estado !== 'completada').length;

  const stats = [
    { icon: '🏠', label: 'Propiedades activas', value: propDisponibles, nav: 'propiedades' },
    { icon: '⏳', label: 'Pendientes de aprobación', value: propPendientes, nav: 'propiedades' },
    { icon: '📅', label: 'Reservas totales', value: reservas.length, nav: 'calendario' },
    { icon: '🧹', label: 'Tareas pendientes', value: tareasPendientes, nav: 'tareas' },
    { icon: '💬', label: 'Tickets abiertos', value: ticketsPendientes, nav: 'tickets' },
    { icon: '👥', label: 'Usuarios registrados', value: usuarios.length, nav: 'usuarios' },
  ];

  // Últimas propiedades pendientes
  const ultimasPendientes = propiedades
    .filter(p => p.estado === 'pendiente')
    .slice(0, 5);

  // Últimos tickets
  const ultimosTickets = tickets
    .filter(t => t.estado === 'pendiente')
    .slice(0, 5);

  return (
    <>
      {/* Stats */}
      <div className={styles.statsRow}>
        {stats.map((s, i) => (
          <div key={i} className={styles.statCard} onClick={() => onNavigate(s.nav)}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Propiedades pendientes */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>⏳ Propiedades pendientes de aprobación</h2>
          {ultimasPendientes.length > 0 && (
            <button className={styles.btnOutline} onClick={() => onNavigate('propiedades')}>
              Ver todas →
            </button>
          )}
        </div>
        <div className={styles.panelBody}>
          {ultimasPendientes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
              ✅ No hay propiedades pendientes de aprobación
            </p>
          ) : (
            ultimasPendientes.map(prop => (
              <div key={prop.id} className={styles.itemCard}>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{prop.titulo}</h3>
                  <p className={styles.itemDetail}>📍 {prop.ubicacion} • 💰 ${prop.precioPorNoche}/noche</p>
                  <p className={styles.itemDetail}>👤 {prop.userEmail}</p>
                </div>
                <span className={`${styles.badge} ${styles.badgeYellow}`}>Pendiente</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tickets abiertos */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>💬 Tickets de soporte abiertos</h2>
          {ultimosTickets.length > 0 && (
            <button className={styles.btnOutline} onClick={() => onNavigate('tickets')}>
              Ver todos →
            </button>
          )}
        </div>
        <div className={styles.panelBody}>
          {ultimosTickets.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
              ✅ No hay tickets pendientes
            </p>
          ) : (
            ultimosTickets.map(t => (
              <div key={t.id} className={styles.itemCard}>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{t.nombre}</h3>
                  <p className={styles.itemDetail}>📧 {t.email} • 📋 {t.asunto || 'Sin asunto'}</p>
                  <p className={styles.itemDetail} style={{ 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' 
                  }}>
                    {t.mensaje}
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.badgeYellow}`}>Pendiente</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}