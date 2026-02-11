'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
        setEsAdmin(currentUser.email === 'gosanti2000@gmail.com')
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#1e3a5f' }}>Cargando...</div>
  }

  return (
    <div className={styles.home}>
      {/* Botón de Admin con OLA - solo visible para gosanti2000@gmail.com */}
      {esAdmin && (
        <button 
          onClick={() => router.push('/admin')}
          style={{
            position: 'fixed',
            top: '20px',
            right: '80px',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 4px 6px rgba(30, 58, 95, 0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 12px rgba(30, 58, 95, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px rgba(30, 58, 95, 0.3)';
          }}
        >
          <span style={{fontSize: '18px'}}>🌊</span> Panel Admin
        </button>
      )}

      <div className={styles.heroSection}>
        <div className={styles.heroImage}></div>
        <div className={styles.heroContent}>
          <div className={styles.searchContainer}>
            <p className={styles.subtitle}>Gestión profesional de alquileres temporales</p>
            <div className={styles.searchBar}>
              <input 
                type="text" 
                placeholder="Busca propiedades asociadas en la plataforma"
                className={styles.searchInput}
              />
              <Link href="/propiedades" className={styles.searchBtn}>
                Buscar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.noResults}>No se encontraron propiedades</p>
      </div>
    </div>
  )
}