'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import styles from './Navbar.module.css'

export default function Navbar() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const currentUser = auth.currentUser
    setUser(currentUser)
    
    if (currentUser) {
      loadUserData(currentUser.uid)
    }
  }, [])

  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setMenuOpen(false)
      router.push('/login')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getUserInitials = () => {
    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase()
    }
    return user?.email ? user.email.charAt(0).toUpperCase() : 'U'
  }

  return (
    <>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="20" height="16" fill="#1e3a5f"/>
            <path d="M20 8 L32 20 L8 20 Z" fill="#1e3a5f"/>
            <rect x="16" y="24" width="8" height="8" fill="white"/>
            <line x1="16" y1="28" x2="24" y2="28" stroke="#1e3a5f" strokeWidth="0.8"/>
            <line x1="20" y1="24" x2="20" y2="32" stroke="#1e3a5f" strokeWidth="0.8"/>
          </svg>
          <span>alquilala</span>
        </Link>

        <button 
          className={styles.hamburgerBtn}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={styles.hamburgerLines}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="User" className={styles.userThumb} />
          ) : (
            <div className={styles.userThumb}>
              {getUserInitials()}
            </div>
          )}
        </button>
      </nav>

      {menuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMenuOpen(false)}></div>
          
          <div className={styles.menu}>
            <div className={styles.menuHeader}>
              <div className={styles.menuUserInfo}>
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="User" className={styles.menuPhoto} />
                ) : (
                  <div className={styles.menuPhoto}>
                    {getUserInitials()}
                  </div>
                )}
                <div>
                  <p className={styles.menuName}>{userData?.displayName || 'Usuario'}</p>
                  <p className={styles.menuEmail}>{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className={styles.menuNav}>
              <Link href="/perfil" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>👤</span>
                Mi Perfil
              </Link>
              
              <Link href="/mis-propiedades" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>🏠</span>
                Mis Propiedades
              </Link>
              
              <Link href="/mis-reservas" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>📅</span>
                Mis Reservas
              </Link>
              
              <div className={styles.divider}></div>
              
              <Link href="/propiedades" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>🔍</span>
                Buscar Propiedades
              </Link>
              
              <Link href="/publicar" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>➕</span>
                Publicar Propiedad
              </Link>
              
              <div className={styles.divider}></div>
              
              <Link href="/ayuda" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>❓</span>
                Ayuda
              </Link>
              
              <Link href="/contactar" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <span>💬</span>
                Contactar Soporte
              </Link>
              
              <div className={styles.divider}></div>
              
              <button className={styles.menuLogout} onClick={handleLogout}>
                <span>🚪</span>
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  )
}