'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function MisReservas() {
  const router = useRouter();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarReservas = async () => {
      if (!auth.currentUser) {
        alert('Debes iniciar sesión');
        router.push('/login');
        return;
      }

      try {
        const q = query(
          collection(db, 'reservas'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const reservasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReservas(reservasData);
      } catch (error) {
        console.error('Error al cargar reservas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarReservas();
  }, [router]);

  return (
    <div className={styles.home}>
      <div className={styles.heroSection}>
        <div className={styles.heroImage}></div>
        <div className={styles.heroContent}>
          <div className={styles.searchContainer}>
            <h1 style={{fontSize: '2.5rem', color: 'white', marginBottom: '1rem'}}>📅 Mis Reservas</h1>
            <p className={styles.subtitle}>Gestiona tus reservas de alquiler</p>
          </div>
        </div>
      </div>

      <div className={styles.content} style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
        {loading ? (
          <p style={{textAlign: 'center', fontSize: '1.25rem', color: '#6b7280', padding: '3rem'}}>
            Cargando tus reservas...
          </p>
        ) : reservas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>📅</div>
            <h2 style={{fontSize: '1.5rem', color: '#1e3a5f', marginBottom: '1rem', fontWeight: 'bold'}}>
              No tienes reservas aún
            </h2>
            <p style={{fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem'}}>
              Explora propiedades y haz tu primera reserva
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔍 Buscar propiedades
            </button>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem'}}>
            {reservas.map(reserva => (
              <div key={reserva.id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e3a5f'}}>
                  {reserva.propiedad}
                </h3>
                
                <div style={{marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem'}}>
                  <p style={{marginBottom: '0.5rem'}}>
                    📅 Check-in: <strong>{reserva.fechaCheckIn || reserva.fecha}</strong>
                  </p>
                  <p style={{marginBottom: '0.5rem'}}>
                    📅 Check-out: <strong>{reserva.fechaCheckOut || '—'}</strong>
                  </p>
                  {reserva.noches && (
                    <p style={{marginBottom: '0.5rem'}}>
                      🌙 {reserva.noches} noches
                    </p>
                  )}
                  {reserva.precioTotal && (
                    <p style={{marginBottom: '0.5rem'}}>
                      💰 Total: <strong>${reserva.precioTotal}</strong>
                    </p>
                  )}
                </div>

                <span style={{
                  display: 'inline-block',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  background: reserva.estado === 'confirmada' ? '#d1fae5' : reserva.estado === 'pendiente' ? '#fef3c7' : '#fee2e2',
                  color: reserva.estado === 'confirmada' ? '#065f46' : reserva.estado === 'pendiente' ? '#92400e' : '#991b1b'
                }}>
                  {reserva.estado === 'confirmada' ? '✅ Confirmada' : 
                   reserva.estado === 'pendiente' ? '⏳ Pendiente' : 
                   '❌ ' + reserva.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}