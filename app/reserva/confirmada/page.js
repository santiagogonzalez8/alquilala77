'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import BtnContrato from '@/components/BtnContrato';

function ReservaConfirmadaContenido() {
  const searchParams = useSearchParams();
  const [datos, setDatos] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalRef = searchParams.get('external_reference');

    if (externalRef) {
      try {
        const ref = JSON.parse(decodeURIComponent(externalRef));
        setDatos({ ...ref, paymentId, status });
      } catch {
        setDatos({ paymentId, status });
      }
    }

    // Trackear conversión GA
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: paymentId,
        currency: 'USD',
      });
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-warm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      paddingTop: 'calc(var(--navbar-height) + 2rem)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{
          color: 'var(--color-primary)',
          fontSize: '1.75rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
        }}>
          ¡Reserva confirmada!
        </h1>
        <p style={{
          color: 'var(--color-text-light)',
          fontSize: '1rem',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}>
          Tu pago fue procesado exitosamente. Te enviamos los detalles por email.
        </p>

        {datos && (
          <div style={{
            background: 'var(--color-bg-warm)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left',
          }}>
            {datos.paymentId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>N° de pago</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>#{datos.paymentId}</span>
              </div>
            )}
            {datos.fechaInicio && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Check-in</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{datos.fechaInicio}</span>
              </div>
            )}
            {datos.fechaFin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Check-out</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{datos.fechaFin}</span>
              </div>
            )}
            {datos.noches && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Noches</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{datos.noches}</span>
              </div>
            )}
            {datos.total && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border-light)',
              }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Total pagado</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                  ${datos.total} USD
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botón descargar contrato */}
        {datos && user && (
          <div style={{ marginBottom: '1rem' }}>
            <BtnContrato
              reserva={{
                id: datos.paymentId,
                fechaCheckIn: datos.fechaInicio,
                fechaCheckOut: datos.fechaFin,
                noches: datos.noches,
                precioTotal: datos.total,
                propiedadId: datos.propiedadId,
                metodoPago: 'mercadopago',
                pagoId: datos.paymentId,
              }}
              propiedad={{ titulo: datos.titulo || datos.propiedadId || 'Propiedad reservada' }}
              userName={user.displayName || ''}
              userEmail={user.email || ''}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/mis-reservas" style={{
            display: 'block',
            background: 'var(--color-primary)',
            color: 'white',
            padding: '0.875rem',
            borderRadius: '8px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}>
            Ver mis reservas →
          </Link>
          <Link href="/" style={{
            display: 'block',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReservaConfirmada() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="loading-spinner" />
      </div>
    }>
      <ReservaConfirmadaContenido />
    </Suspense>
  );
}