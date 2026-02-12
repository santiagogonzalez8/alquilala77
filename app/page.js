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
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      name: 'Punta del Este',
      image: 'https://cdn1.infocasas.com.uy/web/6712c5aa2c0ec_portada-ceee.jpg'
    },
    {
      name: 'Cabo Polonio',
      image: 'https://s3.amazonaws.com/turismorocha/destinos/5/med/cabo-polonio-021102000-1451876133.jpg'
    },
    {
      name: 'Punta del Diablo',
      image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/c0/aa/51/playa-de-punta-del-diablo.jpg?w=700&h=-1&s=1'
    },
    {
      name: 'La Paloma',
      image: 'https://lapalomahoy.uy/09-2021/resize_1630502091.jpg'
    },
    {
      name: 'Colonia del Sacramento',
      image: 'https://www.guruguay.com/wp-content/uploads/2021/05/colonia_del_sacramento_de_los_suspiros_street_night.png'
    }
  ]

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#1e3a5f' }}>Cargando...</div>
  }

  return (
    <div className={styles.home}>
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

      <div className={styles.heroSection} style={{position: 'relative', overflow: 'hidden'}}>
        {/* Carrusel de imágenes de fondo */}
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease',
              zIndex: currentSlide === index ? 1 : 0
            }}
          />
        ))}

        {/* Nombre del lugar - ARRIBA */}
        <div style={{
          position: 'absolute',
          top: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 58, 95, 0.95)',
          color: 'white',
          padding: '0.875rem 2.5rem',
          borderRadius: '12px',
          fontSize: '1.75rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 20
        }}>
          {slides[currentSlide].name}
        </div>

        {/* Botón anterior */}
        <button
          onClick={prevSlide}
          style={{
            position: 'absolute',
            left: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #1e3a5f',
            borderRadius: '50%',
            width: '55px',
            height: '55px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.75rem',
            color: '#1e3a5f',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 20,
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-50%) scale(1.15)';
            e.target.style.background = '#1e3a5f';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(-50%) scale(1)';
            e.target.style.background = 'rgba(255, 255, 255, 0.95)';
            e.target.style.color = '#1e3a5f';
          }}
        >
          ←
        </button>

        {/* Botón siguiente */}
        <button
          onClick={nextSlide}
          style={{
            position: 'absolute',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #1e3a5f',
            borderRadius: '50%',
            width: '55px',
            height: '55px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.75rem',
            color: '#1e3a5f',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 20,
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-50%)