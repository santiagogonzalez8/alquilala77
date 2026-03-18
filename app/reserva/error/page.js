'use client';

import Link from 'next/link';
import { useSearchParams, Suspense } from 'next/navigation';

function ErrorContenido() {
  const searchParams = useSearchParams();
  const propiedadId = searchParams.get('propiedadId');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf6f1 0%, #fff5f5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '3rem 2.5rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
        border: '1px solid #fee2e2',
      }}>
        <div style={{
          width: '80px', height: '80px',
          background: '#fff5f5', borderRadius: '50%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem',
          fontSize: '2.5rem',
        }}>
          😕
        </div>
        <h1 style={{ color: '#1e3a5f', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          El pago no se completó
        </h1>
        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem', lineHeight: 1.6 }}>
          No se realizó ningún cobro a tu cuenta.
        </p>
        <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Podés intentarlo de nuevo o contactarnos si el problema persiste.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {propiedadId && (
            <Link href={`/propiedades/${propiedadId}`} style={{
              display: 'block',
              background: '#1e3a5f',
              color: 'white',
              padding: '0.95rem',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}>
              ↩️ Intentar de nuevo
            </Link>
          )}
          <a
            href="https://wa.me/59895532294?text=Hola!%20Tuve%20un%20problema%20al%20pagar%20una%20reserva"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: '#25D366',
              color: 'white',
              padding: '0.95rem',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            💬 Contactar soporte por WhatsApp
          </a>
          <Link href="/" style={{
            display: 'block',
            color: '#999',
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '0.5rem',
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReservaError() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loading-spinner" /></div>}>
      <ErrorContenido />
    </Suspense>
  );
}