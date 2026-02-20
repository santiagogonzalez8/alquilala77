'use client';

import { useState } from 'react';
import { firestoreUpdate } from '@/lib/firebase';
import styles from '../../app/admin/admin.module.css';

export default function AdminCalendario({ propiedades, reservas, onRefresh }) {
  const [propSeleccionada, setPropSeleccionada] = useState('');
  const [mesActual, setMesActual] = useState(new Date());

  const propDisponibles = propiedades.filter(p => p.estado === 'disponible' || p.estado === 'pendiente');

  const year = mesActual.getFullYear();
  const month = mesActual.getMonth();
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDia = new Date(year, month, 1).getDay();
  const hoy = new Date();

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const mesAnterior = () => setMesActual(new Date(year, month - 1, 1));
  const mesSiguiente = () => setMesActual(new Date(year, month + 1, 1));

  // Obtener fechas ocupadas de la propiedad seleccionada
  const prop = propiedades.find(p => p.id === propSeleccionada);
  const fechasOcupadas = prop?.fechasOcupadas || [];

  const esFechaOcupada = (dia) => {
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return fechasOcupadas.includes(fecha);
  };

  const esHoy = (dia) => {
    return hoy.getFullYear() === year && hoy.getMonth() === month && hoy.getDate() === dia;
  };

  const toggleFecha = async (dia) => {
    if (!propSeleccionada) return;
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    const nuevasFechas = esFechaOcupada(dia)
      ? fechasOcupadas.filter(f => f !== fecha)
      : [...fechasOcupadas, fecha];

    try {
      await firestoreUpdate('propiedades', propSeleccionada, {
        fechasOcupadas: nuevasFechas
      });
      onRefresh();
    } catch (error) {
      alert('Error al actualizar fecha');
    }
  };

  // Generar celdas del calendario
  const celdas = [];
  for (let i = 0; i < primerDia; i++) {
    celdas.push(<div key={`empty-${i}`} className={`${styles.calDay} ${styles.calDayEmpty}`} />);
  }
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const ocupado = propSeleccionada ? esFechaOcupada(dia) : false;
    const today = esHoy(dia);
    celdas.push(
      <button
        key={dia}
        onClick={() => propSeleccionada && toggleFecha(dia)}
        className={`${styles.calDay} ${today ? styles.calDayToday : ''} ${ocupado ? styles.calDayOcupado : ''}`}
        disabled={!propSeleccionada}
        title={ocupado ? 'Ocupado — clic para liberar' : 'Disponible — clic para marcar ocupado'}
      >
        {dia}
      </button>
    );
  }

  return (
    <>
      {/* Selector de propiedad */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>📅 Calendario de Disponibilidad</h2>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.formGroup}>
            <label>Seleccioná una propiedad:</label>
            <select
              value={propSeleccionada}
              onChange={(e) => setPropSeleccionada(e.target.value)}
              className={styles.filterSelect}
              style={{ width: '100%' }}
            >
              <option value="">— Elegí una propiedad —</option>
              {propDisponibles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.titulo} — {p.ubicacion}
                </option>
              ))}
            </select>
          </div>

          {!propSeleccionada ? (
            <div className={styles.emptyState} style={{ padding: '2rem' }}>
              <div className={styles.emptyIcon}>📅</div>
              <p>Seleccioná una propiedad para gestionar su calendario</p>
            </div>
          ) : (
            <>
              {/* Navegación del mes */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1rem', padding: '0.5rem 0'
              }}>
                <button onClick={mesAnterior} className={styles.btnOutline} style={{ minWidth: 'auto' }}>
                  ← Anterior
                </button>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {meses[month]} {year}
                </h3>
                <button onClick={mesSiguiente} className={styles.btnOutline} style={{ minWidth: 'auto' }}>
                  Siguiente →
                </button>
              </div>

              {/* Grilla */}
              <div className={styles.calGrid}>
                {diasSemana.map(d => (
                  <div key={d} className={styles.calHeader}>{d}</div>
                ))}
                {celdas}
              </div>

              {/* Leyenda */}
              <div className={styles.calLegend}>
                <div className={styles.calLegendItem}>
                  <div className={styles.calLegendDot} style={{ background: 'white', border: '1px solid #ccc' }} />
                  Disponible
                </div>
                <div className={styles.calLegendItem}>
                  <div className={styles.calLegendDot} style={{ background: '#ffcdd2' }} />
                  Ocupado
                </div>
                <div className={styles.calLegendItem}>
                  <div className={styles.calLegendDot} style={{ border: '2px solid var(--color-primary)' }} />
                  Hoy
                </div>
              </div>

              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                💡 Hacé clic en un día para marcarlo como ocupado/disponible.
                Las fechas se guardan automáticamente.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}