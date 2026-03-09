'use client'

import { useState } from 'react'

export default function BtnContrato({
  reserva,
  propiedad,
  userName,
  userEmail,
  userTelefono,
  variant = 'primary',
}) {
  const [loading, setLoading] = useState(false)

  const handleDescargar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propiedadTitulo: propiedad?.titulo || reserva?.propiedad || '',
          propiedadUbicacion: propiedad?.ubicacion || reserva?.ubicacion || '',
          propiedadHuespedes: propiedad?.huespedes || '',
          fechaCheckIn: reserva?.fechaCheckIn || reserva?.fecha || '',
          fechaCheckOut: reserva?.fechaCheckOut || '',
          noches: reserva?.noches || 0,
          total: reserva?.precioTotal || 0,
          userName: userName || '',
          userEmail: userEmail || '',
          userTelefono: userTelefono || '',
          metodoPago: reserva?.metodoPago || '',
          pagoId: reserva?.pagoId || reserva?.id || '',
        }),
      })

      if (!res.ok) throw new Error('Error generando contrato')

      const html = await res.text()

      // Abrir en nueva pestaña para imprimir/guardar como PDF
      const ventana = window.open('', '_blank')
      ventana.document.write(html)
      ventana.document.close()

      // Esperar a que cargue y disparar print
      ventana.onload = () => {
        setTimeout(() => {
          ventana.print()
        }, 500)
      }

    } catch (err) {
      alert('Error al generar el contrato. Intentá de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const estilosBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.25rem',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.875rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    opacity: loading ? 0.7 : 1,
  }

  const estilos = variant === 'outline' ? {
    ...estilosBase,
    background: 'white',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-border)',
  } : {
    ...estilosBase,
    background: 'var(--color-primary)',
    color: 'white',
  }

  return (
    <button onClick={handleDescargar} disabled={loading} style={estilos}>
      {loading ? '⏳' : '📄'}
      {loading ? 'Generando...' : 'Descargar contrato'}
    </button>
  )
}