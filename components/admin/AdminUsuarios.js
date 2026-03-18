'use client';

import { useState } from 'react';
import { isAdmin } from '@/lib/firebase';
import styles from '../../app/admin/admin.module.css';

export default function AdminUsuarios({ usuarios, propiedades }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = usuarios.filter(u =>
    !busqueda ||
    u.displayName?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getPropiedadesDeUsuario = (email) =>
    propiedades.filter(p => p.userEmail === email).length;

  const formatFecha = (str) => {
    if (!str) return null;
    try {
      return new Date(str).toLocaleDateString('es-UY', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return null; }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>👥 Usuarios Registrados ({filtrados.length})</h2>
        <div className={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.filterInput}
          />
        </div>
      </div>

      <div className={styles.panelBody}>
        {filtrados.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>Ajustá la búsqueda o esperá nuevos registros.</p>
          </div>
        ) : (
          filtrados.map(usr => {
            const cantPropiedades = getPropiedadesDeUsuario(usr.email);
            const esAdminUser = isAdmin(usr.email);
            const fecha = formatFecha(usr.createdAt || usr.fechaRegistro);

            return (
              <div key={usr.id} className={styles.itemCard}>
                <div className={styles.itemInfo} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {usr.photoURL ? (
                    <img
                      src={usr.photoURL}
                      alt=""
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: esAdminUser ? 'var(--color-accent)' : 'var(--color-primary)',
                      color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1.1rem', flexShrink: 0
                    }}>
                      {usr.displayName?.charAt(0)?.toUpperCase() || usr.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 className={styles.itemTitle} style={{ marginBottom: 0 }}>
                        {usr.displayName || 'Sin nombre'}
                      </h3>
                      {esAdminUser && (
                        <span style={{
                          background: 'var(--color-accent)', color: 'white',
                          fontSize: '0.7rem', fontWeight: 700,
                          padding: '0.15rem 0.5rem', borderRadius: '999px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p className={styles.itemDetail}>📧 {usr.email}</p>
                    {usr.phone && <p className={styles.itemDetail}>📱 {usr.phone}</p>}
                    {fecha && (
                      <p className={styles.itemDetail} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        📅 Registrado: {fecha}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`${styles.badge} ${cantPropiedades > 0 ? styles.badgeGreen : styles.badgeGray}`}>
                    🏠 {cantPropiedades} {cantPropiedades === 1 ? 'propiedad' : 'propiedades'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}