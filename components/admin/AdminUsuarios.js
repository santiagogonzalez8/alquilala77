'use client';

import { useState } from 'react';
import styles from '../../app/admin/admin.module.css';

export default function AdminUsuarios({ usuarios, propiedades }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = usuarios.filter(u =>
    !busqueda ||
    u.displayName?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getPropiedadesDeUsuario = (email) => {
    return propiedades.filter(p => p.userEmail === email).length;
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
            <p>Ajustá la búsqueda o esperá a que se registren nuevos usuarios.</p>
          </div>
        ) : (
          filtrados.map(usr => {
            const cantPropiedades = getPropiedadesDeUsuario(usr.email);
            return (
              <div key={usr.id} className={styles.itemCard}>
                <div className={styles.itemInfo} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Avatar */}
                  {usr.photoURL ? (
                    <img
                      src={usr.photoURL}
                      alt=""
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        objectFit: 'cover', flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--color-primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1rem', flexShrink: 0
                    }}>
                      {usr.displayName?.charAt(0)?.toUpperCase() || usr.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className={styles.itemTitle} style={{ marginBottom: '0.15rem' }}>
                      {usr.displayName || 'Sin nombre'}
                    </h3>
                    <p className={styles.itemDetail}>📧 {usr.email}</p>
                    {usr.phone && <p className={styles.itemDetail}>📱 {usr.phone}</p>}
                    {usr.location && <p className={styles.itemDetail}>📍 {usr.location}</p>}
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