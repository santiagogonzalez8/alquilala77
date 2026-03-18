'use client';

import { useState } from 'react';
import styles from './soporte.module.css';

export default function Soporte() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: 'Consulta general',
    mensaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || '',
          asunto: formData.asunto,
          mensaje: formData.mensaje,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al enviar ticket');
      }

      setEnviado(true);
      setFormData({ nombre: '', email: '', telefono: '', asunto: 'Consulta general', mensaje: '' });
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Error al enviar el mensaje. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="section-label">Contacto</span>
          <h1 className={styles.headerTitle}>Contáctanos</h1>
          <p className={styles.headerSubtitle}>
            ¿Tenés una consulta sobre nuestro servicio? Escribinos y te respondemos a la brevedad.
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>

          {/* Formulario */}
          <div className={styles.formCard}>
            {enviado ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>✅</div>
                <h3>¡Mensaje enviado!</h3>
                <p>Te responderemos lo antes posible. Revisá tu email.</p>
                <button
                  onClick={() => setEnviado(false)}
                  className={styles.btnSendAnother}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Teléfono{' '}
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                      (opcional — para respuesta por WhatsApp)
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+598 99 123 456"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Asunto</label>
                  <select name="asunto" value={formData.asunto} onChange={handleChange}>
                    <option value="Consulta general">Consulta general</option>
                    <option value="Quiero publicar mi propiedad">Quiero publicar mi propiedad</option>
                    <option value="Problema técnico">Problema técnico</option>
                    <option value="Información de precios">Información de precios</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Mensaje *</label>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Contanos en qué podemos ayudarte..."
                  />
                </div>

                <button type="submit" disabled={loading} className={styles.btnSubmit}>
                  {loading ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </form>
            )}
          </div>

          {/* Info lateral */}
          <div className={styles.infoSide}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>💬</div>
              <h3>WhatsApp</h3>
              <p>Respuesta rápida por chat</p>
              <a
                href="https://wa.me/59895532294?text=Hola!%20Quiero%20información%20sobre%20el%20servicio%20de%20gestión%20de%20alquileres"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.infoLink}
              >
                Escribinos →
              </a>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📧</div>
              <h3>Email</h3>
              <p>Te respondemos en 24hs</p>
              <a href="mailto:gosanti2000@gmail.com" className={styles.infoLink}>
                gosanti2000@gmail.com
              </a>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📍</div>
              <h3>Ubicación</h3>
              <p>Montevideo, Uruguay</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🕐</div>
              <h3>Horario</h3>
              <p>Lunes a viernes</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                9:00 — 18:00 (UYT)
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}