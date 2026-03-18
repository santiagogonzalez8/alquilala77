'use client';

import styles from '../../app/admin/admin.module.css';

export default function AdminDashboard({ propiedades, reservas, tickets, tareas, usuarios, onNavigate }) {
  const propDisponibles = propiedades.filter(p => p.estado === 'disponible').length;
  const propPendientes = propiedades.filter(p => p.estado === 'pendiente').length;
  const ticketsPendientes = tickets.filter(t => t.estado === 'pendiente').length;
  const tareasPendientes = tareas.filter(t => t.estado !== 'completada').length;

  const stats = [
    { icon: '🏠', label: 'Propiedades activas', value: propDisponibles, nav: 'propiedades', color: '#e3f2fd' },
    { icon: '⏳', label: 'Pendientes de aprobación', value: propPendientes, nav: 'propiedades', color: '#fff8e1', alert: propPendientes > 0 },
    { icon: '📅', label: 'Reservas totales', value: reservas.length, nav: 'calendario', color: '#f3e5f5' },
    { icon: '🧹', label: 'Tareas pendientes', value: tareasPendientes, nav: 'tareas', color: '#fce4ec', alert: tareasPendientes > 0 },
    { icon: '💬', label: 'Tickets abiertos', value: ticketsPendientes, nav: 'tickets', color: '#fff3e0', alert: ticketsPendientes > 0 },
    { icon: '👥', label: 'Usuarios registrados', value: usuarios.length, nav: 'usuarios', color: '#e8f5e9' },
  ];

  const ultimasPendientes = propiedades
    .filter(p => p.estado === 'pendiente')
    .slice(0, 5);

  const ultimosTickets = tickets
    .filter(t => t.estado === 'pendiente')
    .slice(0, 5);

  const formatFecha = (str) => {
    if (!str) return 'N/A';
    try {
      return new Date(str).toLocaleDateString('es-UY', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return 'N/A'; }
  };

  return (
    <>
      {/* Bienvenida */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #2d5a9e 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            ¡Bienvenido al panel de Alquilala! 👋
          </h2>
          <p style={{ opacity: 0.85, fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {(propPendientes > 0 || ticketsPendientes > 0) && (
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}>
            {propPendientes > 0 && <div>⏳ {propPendientes} propiedad{propPendientes !== 1 ? 'es' : ''} esperando aprobación</div>}
            {ticketsPendientes > 0 && <div>💬 {ticketsPendientes} ticket{ticketsPendientes !== 1 ? 's' : ''} sin responder</div>}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {stats.map((s, i) => (
          <div
            key={i}
            className={styles.statCard}
            onClick={() => onNavigate(s.nav)}
            style={{ borderTop: s.alert ? '3px solid var(--color-accent)' : '3px solid transparent' }}
          >
            <div style={{
              background: s.color,
              width: 52,
              height: 52,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}>
              {s.icon}
            </div>
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
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontWeight: 600 }}>No hay propiedades pendientes</p>
            </div>
          ) : (
            ultimasPendientes.map(prop => (
              <div key={prop.id} className={styles.itemCard}>
                <div className={styles.itemInfo} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  {(prop.imagenes?.[0] || prop.fotoPrincipal) && (
                    <img
                      src={prop.imagenes?.[0] || prop.fotoPrincipal}
                      alt=""
                      style={{ width: 52, height: 52, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className={styles.itemTitle}>{prop.titulo}</h3>
                    <p className={styles.itemDetail}>📍 {prop.ubicacion} • 💰 ${prop.precioPorNoche}/noche</p>
                    <p className={styles.itemDetail}>👤 {prop.userEmail}</p>
                    <p className={styles.itemDetail} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      📅 Publicada: {formatFecha(prop.fechaPublicacion)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                  <span className={`${styles.badge} ${styles.badgeYellow}`}>Pendiente</span>
                  <button
                    className={styles.btnOutline}
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => onNavigate('propiedades')}
                  >
                    Revisar →
                  </button>
                </div>
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
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontWeight: 600 }}>No hay tickets pendientes</p>
            </div>
          ) : (
            ultimosTickets.map(t => (
              <div key={t.id} className={styles.itemCard}>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{t.nombre}</h3>
                  <p className={styles.itemDetail}>📧 {t.email}</p>
                  <p className={styles.itemDetail}>📋 {t.asunto || 'Sin asunto'}</p>
                  <p className={styles.itemDetail} style={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: '400px',
                    color: 'var(--color-text-muted)', fontStyle: 'italic'
                  }}>
                    "{t.mensaje}"
                  </p>
                  {t.fecha && (
                    <p className={styles.itemDetail} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      📅 {formatFecha(t.fecha)}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                  <span className={`${styles.badge} ${styles.badgeYellow}`}>Pendiente</span>
                  <button
                    className={styles.btnOutline}
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => onNavigate('tickets')}
                  >
                    Responder →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}