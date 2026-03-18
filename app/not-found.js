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
      background: '#faf6f1'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏖️</div>
      <h1 style={{
        fontSize: '6rem',
        fontWeight: 800,
        color: '#1e3a5f',
        lineHeight: 1,
        marginBottom: '0.5rem'
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#1e3a5f',
        marginBottom: '0.75rem'
      }}>
        Página no encontrada
      </h2>
      <p style={{
        fontSize: '1.1rem',
        color: '#666',
        maxWidth: '400px',
        marginBottom: '2rem',
        lineHeight: 1.6
      }}>
        Parece que esta página se fue de vacaciones. Volvé al inicio para seguir explorando.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            background: '#1e3a5f',
            color: 'white',
            padding: '0.85rem 2rem',
            borderRadius: '8px',
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
            padding: '0.85rem 2rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          🔍 Ver propiedades
        </Link>
      </div>
    </div>
  )
}