'use client';

import Link from 'next/link';
import styles from './ayuda.module.css';

export default function Ayuda() {
  const categorias = [
    {
      titulo: '🏠 Para propietarios',
      faqs: [
        {
          pregunta: '¿Qué es Alquilala?',
          respuesta: 'Alquilala es un servicio de gestión profesional de alquileres temporales. Nos encargamos de publicar y administrar tu propiedad en Airbnb, Booking y MercadoLibre, incluyendo limpieza, mantenimiento y atención al huésped.'
        },
        {
          pregunta: '¿Cómo publico mi propiedad?',
          respuesta: 'Registrate en la plataforma, completá el formulario con los datos de tu casa (fotos, ubicación, capacidad, amenities) y nosotros nos encargamos de todo lo demás. El proceso toma menos de 10 minutos.'
        },
        {
          pregunta: '¿Cuánto cuesta el servicio?',
          respuesta: 'Cobramos una comisión del 15% sobre cada reserva concretada. Sin cuota mensual, sin contrato de permanencia. Si no generás ingresos, no pagás nada.'
        },
        {
          pregunta: '¿En qué plataformas se publica mi propiedad?',
          respuesta: 'Publicamos simultáneamente en Airbnb, Booking y MercadoLibre, maximizando tu visibilidad y ocupación durante todo el año.'
        },
        {
          pregunta: '¿Puedo ver el estado de mis reservas?',
          respuesta: 'Sí, desde tu panel de usuario podés ver tus propiedades, reservas activas, fechas ocupadas e ingresos en tiempo real.'
        },
      ]
    },
    {
      titulo: '🛎️ Gestión y operativa',
      faqs: [
        {
          pregunta: '¿Quién se encarga de la limpieza?',
          respuesta: 'Nosotros coordinamos la limpieza entre huéspedes, cortapasto, mantenimiento y todo lo que tu propiedad necesite. Todo incluido en la comisión del 15%.'
        },
        {
          pregunta: '¿Qué pasa si un huésped tiene un problema?',
          respuesta: 'Nuestro equipo está disponible para atender consultas y resolver cualquier inconveniente con los huéspedes las 24 horas, todos los días.'
        },
        {
          pregunta: '¿Cómo funciona el check-in y check-out?',
          respuesta: 'Coordinamos la entrega y devolución de llaves con cada huésped. Ofrecemos check-in autónomo cuando es posible para mayor comodidad.'
        },
      ]
    },
    {
      titulo: '💳 Pagos y reservas',
      faqs: [
        {
          pregunta: '¿Cómo recibo mis ingresos?',
          respuesta: 'Te transferimos los ingresos descontando nuestra comisión del 15%. Podés ver el desglose completo en tu panel de propietario.'
        },
        {
          pregunta: '¿Qué métodos de pago aceptan los huéspedes?',
          respuesta: 'Los huéspedes pueden pagar con tarjeta de crédito, débito y efectivo a través de MercadoPago. También aceptamos transferencia bancaria para reservas directas.'
        },
        {
          pregunta: '¿Cuál es la política de cancelación?',
          respuesta: 'Con más de 30 días de anticipación: reembolso del 80%. Entre 15 y 30 días: reembolso del 50%. Con menos de 15 días: sin reembolso. Casos de fuerza mayor se evalúan individualmente.'
        },
      ]
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="section-label">Soporte</span>
          <h1 className={styles.headerTitle}>Centro de Ayuda</h1>
          <p className={styles.headerSubtitle}>
            Encontrá respuestas a las preguntas más frecuentes
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {categorias.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid var(--color-border-light)',
            }}>
              {cat.titulo}
            </h2>
            <div className={styles.faqList}>
              {cat.faqs.map((faq, index) => (
                <details key={index} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>
                    {faq.pregunta}
                  </summary>
                  <p className={styles.faqAnswer}>
                    {faq.respuesta}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.ctaBox}>
          <div className={styles.ctaIcon}>💬</div>
          <h3>¿No encontraste lo que buscabas?</h3>
          <p>Nuestro equipo está listo para ayudarte con cualquier consulta.</p>
          <div className={styles.ctaButtons}>
            <Link href="/soporte" className={styles.ctaBtn}>
              Contactanos
            </Link>
            <a
              href="https://wa.me/59895532294?text=Hola!%20Tengo%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtnWhatsapp}
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}