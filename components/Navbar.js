'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, firestoreGet } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { isAdmin } from '@/lib/adminConfig'
import styles from './Navbar.module.css'

export default function Navbar({ user }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (user) loadUserData(user.uid)
    else setUserData(null)
  }, [user])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const loadUserData = async (uid) => {
    try {
      const data = await firestoreGet('users', uid)
      setUserData(data)
    } catch {
      setUserData({
        displayName: auth.currentUser?.displayName,
        photoURL: auth.currentUser?.photoURL
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setMenuOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getUserInitials = () => {
    if (userData?.displayName) return userData.displayName.charAt(0).toUpperCase()
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase()
    return user?.email ? user.email.charAt(0).toUpperCase() : 'U'
  }

  const getPhotoURL = () => userData?.photoURL || user?.photoURL || null

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="20" width="20" height="16" fill="#1e3a5f"/>
              <path d="M20 8 L32 20 L8 20 Z" fill="#1e3a5f"/>
              <rect x="16" y="24" width="8" height="8" fill="white"/>
              <line x1="16" y1="28" x2="24" y2="28" stroke="#1e3a5f" strokeWidth="0.8"/>
              <line x1="20" y1="24" x2="20" y2="32" stroke="#1e3a5f" strokeWidth="0.8"/>
            </svg>
            <span>alquilala</span>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/#como-funciona" className={styles.navLink}>Cómo funciona</Link>
            <Link href="/#servicios" className={styles.navLink}>Servicios</Link>
            <Link href="/#propiedades" className={styles.navLink}>Propiedades</Link>
            <Link href="/soporte" className={styles.navLink}>Contacto</Link>
          </div>

          <div className={styles.navRight}>
            {user ? (
              <>
                {isAdmin(user.email) && (
                  <Link href="/admin" className={styles.adminBadge}>Panel Admin</Link>
                )}
                <button
                  className={styles.userButton}
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menú de usuario"
                >
                  <div className={styles.hamburgerLines}>
                    <span></span><span></span><span></span>
                  </div>
                  {getPhotoURL() ? (
                    <img src={getPhotoURL()} alt="User" className={styles.userThumb} />
                  ) : (
                    <div className={styles.userInitial}>{getUserInitials()}</div>
                  )}
                </button>
              </>
            ) : (
              <div className={styles.authButtons}>
                <Link href="/login" className={styles.btnLogin}>Iniciar sesión</Link>
                <Link href="/login" className={styles.btnRegister}>Publicá tu casa</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.menu}>
            <div className={styles.menuHeader}>
              <button className={styles.menuClose} onClick={() => setMenuOpen(false)}>✕</button>
              <div className={styles.menuUserInfo}>
                {getPhotoURL() ? (
                  <img src={getPhotoURL()} alt="User" className={styles.menuPhoto} />
                ) : (
                  <div className={styles.menuPhoto}>{getUserInitials()}</div>
                )}
                <div>
                  <p className={styles.menuName}>{userData?.displayName || user?.displayName || 'Usuario'}</p>
                  <p className={styles.menuEmail}>{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className={styles.menuNav}>
              <Link href="/mi-panel" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>📊</span> Mi Panel
              </Link>
              <Link href="/perfil" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>👤</span> Mi Perfil
              </Link>

              <div className={styles.divider} />

              <Link href="/mis-propiedades" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>🏠</span> Mis Propiedades
              </Link>
              <Link href="/mis-reservas" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>📅</span> Mis Reservas
              </Link>
              <Link href="/publicar" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>➕</span> Publicar Propiedad
              </Link>

              <div className={styles.divider} />

              <Link href="/ayuda" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>❓</span> Ayuda
              </Link>
              <Link href="/soporte" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>💬</span> Contáctanos
              </Link>

              {isAdmin(user?.email) && (
                <>
                  <div className={styles.divider} />
                  <Link href="/admin" className={styles.menuItemAdmin} onClick={() => setMenuOpen(false)}>
                    <span>⚙️</span> Panel de Administración
                  </Link>
                </>
              )}

              <div className={styles.divider} />

              <button className={styles.menuLogout} onClick={handleLogout}>
                <span>🚪</span> Cerrar Sesión
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  )
}