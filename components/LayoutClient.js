'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Navbar from '@/components/Navbar'
import ScrollToTop from '@/components/ScrollToTop'
import GoogleAnalytics from '@/components/GoogleAnalytics'

function trackPageView(url) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', 'G-LTFTEXY9NM', { page_path: url })
}

export default function LayoutClient({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pwaPrompt, setPwaPrompt] = useState(null)
  const [showPwaBar, setShowPwaBar] = useState(false)

  // Registrar service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registrado:', reg.scope))
        .catch((err) => console.log('SW error:', err))
    }
  }, [])

  // Capturar el prompt de instalación PWA
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPwaPrompt(e)
      // Mostrar barra de instalación después de 30 segundos
      setTimeout(() => setShowPwaBar(true), 30000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Trackear page views
  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url)
  }, [pathname, searchParams])

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'login', {
          method: currentUser.providerData?.[0]?.providerId || 'email',
        })
      }
    })
    return () => unsubscribe()
  }, [])

  const instalarPWA = async () => {
    if (!pwaPrompt) return
    pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPwaBar(false)
      setPwaPrompt(null)
    }
  }

  const isLoginPage = pathname === '/login'
  const isAdminPage = pathname?.startsWith('/admin')

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <span>Cargando...</span>
      </div>
    )
  }

  return (
    <>
      <GoogleAnalytics />

      {!isLoginPage && !isAdminPage && <Navbar user={user} />}

      {/* Barra de instalación PWA */}
      {showPwaBar && pwaPrompt && !isLoginPage && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--color-primary)',
          color: 'white',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          zIndex: 9998,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏠</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                Instalá Alquilala
              </p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0 }}>
                Accedé más rápido desde tu celular
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => setShowPwaBar(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            >
              Ahora no
            </button>
            <button
              onClick={instalarPWA}
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      <main>{children}</main>

      {!isLoginPage && !isAdminPage && (
        <>
          <ScrollToTop />
          <footer className="footer">
            <div className="footer-links">
              <a href="/ayuda">Ayuda</a>
              <a href="/soporte">Contacto</a>
              <a
                href="https://wa.me/59895532294"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
            <div className="footer-bottom">
              <p>© 2025 Alquilala — Gestión profesional de alquileres temporales en Uruguay</p>
            </div>
          </footer>
        </>
      )}
    </>
  )
}