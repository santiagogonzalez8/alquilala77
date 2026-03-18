import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      paddingTop: 'calc(var(--navbar-height) + 2rem)',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #faf6f1 0%, #f0f4ff 100%)',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏖️</div>
      <h1 style={{
        fontSize: '7rem',
        fontWeight: 900,
        color: '#1e3a5f',
        lineHeight: 1,
        marginBottom: '0.25rem',
        letterSpacing: '-4px',
        opacity: 0.15,
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 800,
        color: '#1e3a5f',
        marginBottom: '0.75rem',
        marginTop: '-1rem',
      }}>
        Página no encontrada
      </h2>
      <p style={{
        fontSize: '1.05rem',
        color: '#666',
        maxWidth: '420px',
        marginBottom: '2.5rem',
        lineHeight: 1.7,
      }}>
        Parece que esta página se fue de vacaciones. 
        Volvé al inicio para seguir explorando propiedades.
      </p>
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <Link
          href="/"
          style={{
            background: '#1e3a5f',
            color: 'white',
            padding: '0.9rem 2rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          ← Volver al inicio
        </Link>
        <Link
          href="/buscar"
          style={{
            background: 'white',
            color: '#1e3a5f',
            border: '2px solid #1e3a5f',
            padding: '0.9rem 2rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          🔍 Ver propiedades
        </Link>
        <Link
          href="/soporte"
          style={{
            background: 'white',
            color: '#666',
            border: '1px solid #e0e0e0',
            padding: '0.9rem 2rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          💬 Contacto
        </Link>
      </div>
    </div>
  )
}