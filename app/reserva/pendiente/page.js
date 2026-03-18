'use client';

import Link from 'next/link';

export default function ReservaPendiente() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf6f1 0%, #fffbeb 100%)',
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
        border: '1px solid #fde68a',
      }}>
        <div style={{
          width: '80px', height: '80px',
          background: '#fffbeb', borderRadius: '50%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem',
          fontSize: '2.5rem',
        }}>
          ⏳
        </div>
        <h1 style={{
          color: '#1e3a5f',
          fontSize: '1.75rem',
          fontWeight: 800,
          marginBottom: '0.75rem',
        }}>
          Pago en proceso
        </h1>
        <p style={{
          color: '#666',
          fontSize: '1rem',
          marginBottom: '0.5rem',
          lineHeight: 1.6,
        }}>
          Tu pago está siendo procesado por MercadoPago.
        </p>
        <p style={{
          color: '#999',
          fontSize: '0.875rem',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}>
          Te notificaremos por email cuando se confirme. Esto puede tardar hasta 24hs dependiendo del método de pago elegido.
        </p>

        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#92400e',
          textAlign: 'left',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>ℹ️</span>
          <span>
            No realices el pago nuevamente. Tu solicitud ya fue registrada y está siendo verificada.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/mis-reservas" style={{
            display: 'block',
            background: '#1e3a5f',
            color: 'white',
            padding: '0.95rem',
            borderRadius: '10px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}>
            Ver mis reservas
          </Link>
          <a
            href="https://wa.me/59895532294?text=Hola!%20Hice%20un%20pago%20que%20quedó%20pendiente%20y%20quiero%20consultar%20el%20estado"
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
            💬 Consultar estado por WhatsApp
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