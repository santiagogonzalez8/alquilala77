'use client'

import { useState, useEffect, useRef } from 'react'
import { auth, firestoreGet, firestoreSet, storage } from '@/lib/firebase'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import styles from './perfil.module.css'

const DECADAS = [
  'Década de los 50', 'Década de los 60', 'Década de los 70',
  'Década de los 80', 'Década de los 90', 'Década de los 00', 'Década de los 10',
]

const IDIOMAS_DISPONIBLES = [
  'Español', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán', 'Chino', 'Japonés'
]

function PerfilContenido() {
  const router = useRouter()
  const fileRef = useRef(null)
  const [user, setUser] = useState(null)
  const [seccion, setSeccion] = useState('info')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [toast, setToast] = useState('')
  const [editando, setEditando] = useState(false)

  // Datos del perfil
  const [perfil, setPerfil] = useState({
    displayName: '',
    email: '',
    telefono: '',
    ubicacion: '',
    decada: '',
    idioma: '',
    biografia: '',
    photoURL: '',
    identidadVerificada: false,
    fechaRegistro: '',
  })

  // Stats
  const [stats, setStats] = useState({
    viajes: 0,
    resenas: 0,
    anos: 0,
  })

  // Configuración de cuenta
  const [config, setConfig] = useState({
    notificacionesEmail: true,
    notificacionesWA: false,
    perfilPublico: true,
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return }
      setUser(u)
      await cargarPerfil(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const cargarPerfil = async (u) => {
    try {
      const data = await firestoreGet('users', u.uid)
      if (data) {
        setPerfil({
          displayName: data.displayName || u.displayName || '',
          email: u.email || '',
          telefono: data.telefono || '',
          ubicacion: data.ubicacion || '',
          decada: data.decada || '',
          idioma: data.idioma || 'Español',
          biografia: data.biografia || '',
          photoURL: data.photoURL || u.photoURL || '',
          identidadVerificada: data.identidadVerificada || false,
          fechaRegistro: data.fechaRegistro || u.metadata?.creationTime || '',
        })
        setConfig({
          notificacionesEmail: data.notificacionesEmail !== false,
          notificacionesWA: data.notificacionesWA || false,
          perfilPublico: data.perfilPublico !== false,
        })
        setStats({
          viajes: data.viajes || 0,
          resenas: data.resenas || 0,
          anos: data.fechaRegistro
            ? Math.floor((Date.now() - new Date(data.fechaRegistro)) / (1000 * 60 * 60 * 24 * 365))
            : 0,
        })
      } else {
        setPerfil(prev => ({
          ...prev,
          displayName: u.displayName || '',
          email: u.email || '',
          photoURL: u.photoURL || '',
        }))
      }
    } catch (err) {
      console.error('Error cargando perfil:', err)
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await firestoreSet('users', user.uid, {
        ...perfil,
        ...config,
        updatedAt: new Date().toISOString(),
      })
      await updateProfile(auth.currentUser, {
        displayName: perfil.displayName,
        photoURL: perfil.photoURL,
      })
      setEditando(false)
      showToast('✅ Perfil guardado correctamente')
    } catch (err) {
      showToast('❌ Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoFoto(true)
    try {
      const storageRef = ref(storage, `usuarios/${user.uid}/foto-perfil`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setPerfil(prev => ({ ...prev, photoURL: url }))
      await firestoreSet('users', user.uid, { ...perfil, photoURL: url })
      await updateProfile(auth.currentUser, { photoURL: url })
      showToast('✅ Foto actualizada')
    } catch (err) {
      showToast('❌ Error al subir foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const getAnosEnPlataforma = () => {
    if (!perfil.fechaRegistro) return 0
    return Math.floor(
      (Date.now() - new Date(perfil.fechaRegistro)) / (1000 * 60 * 60 * 24 * 365)
    )
  }

  const secciones = [
    { id: 'info', label: 'Información sobre mí', icon: '👤' },
    { id: 'cuenta', label: 'Configuración de cuenta', icon: '⚙️' },
    { id: 'seguridad', label: 'Inicio de sesión y seguridad', icon: '🛡️' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
    { id: 'privacidad', label: 'Privacidad', icon: '🤝' },
  ]

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className="loading-spinner" />
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* Toast */}
      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}

      <div className={styles.layout}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <h1 className={styles.sidebarTitulo}>Perfil</h1>
          <nav className={styles.sidebarNav}>
            {secciones.map(s => (
              <button
                key={s.id}
                className={`${styles.sidebarItem} ${seccion === s.id ? styles.sidebarItemActivo : ''}`}
                onClick={() => setSeccion(s.id)}
              >
                <span className={styles.sidebarIcon}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <main className={styles.main}>

          {/* ── Sección: Info ── */}
          {seccion === 'info' && (
            <div className={styles.seccion}>
              <div className={styles.seccionHeader}>
                <h2 className={styles.seccionTitulo}>Información sobre mí</h2>
                {!editando && (
                  <button className={styles.btnEditar} onClick={() => setEditando(true)}>
                    Editar
                  </button>
                )}
              </div>

              <div className={styles.infoLayout}>

                {/* Card perfil */}
                <div className={styles.perfilCard}>
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatarContainer}>
                      {perfil.photoURL ? (
                        <img src={perfil.photoURL} alt="Foto de perfil" className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {perfil.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <button
                        className={styles.avatarEditBtn}
                        onClick={() => fileRef.current?.click()}
                        disabled={subiendoFoto}
                        title="Cambiar foto"
                      >
                        {subiendoFoto ? '⏳' : '📷'}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFoto}
                        style={{ display: 'none' }}
                      />
                    </div>
                    {perfil.identidadVerificada && (
                      <div className={styles.verificadoBadge}>✓</div>
                    )}
                  </div>

                  <h3 className={styles.perfilNombre}>{perfil.displayName || 'Usuario'}</h3>
                  {perfil.ubicacion && (
                    <p className={styles.perfilUbicacion}>{perfil.ubicacion}</p>
                  )}

                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statNum}>{stats.viajes}</span>
                      <span className={styles.statLabel}>Viajes</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <span className={styles.statNum}>{stats.resenas}</span>
                      <span className={styles.statLabel}>Reseñas</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <span className={styles.statNum}>{getAnosEnPlataforma()}</span>
                      <span className={styles.statLabel}>Años en Alquilala</span>
                    </div>
                  </div>
                </div>

                {/* Info detallada */}
                <div className={styles.infoDetalle}>

                  {editando ? (
                    /* Modo edición */
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Nombre</label>
                        <input
                          value={perfil.displayName}
                          onChange={e => setPerfil(p => ({ ...p, displayName: e.target.value }))}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Ubicación</label>
                        <input
                          value={perfil.ubicacion}
                          onChange={e => setPerfil(p => ({ ...p, ubicacion: e.target.value }))}
                          placeholder="Ciudad, País"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Decade de nacimiento</label>
                        <select
                          value={perfil.decada}
                          onChange={e => setPerfil(p => ({ ...p, decada: e.target.value }))}
                        >
                          <option value="">Seleccioná</option>
                          {DECADAS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Idioma</label>
                        <select
                          value={perfil.idioma}
                          onChange={e => setPerfil(p => ({ ...p, idioma: e.target.value }))}
                        >
                          {IDIOMAS_DISPONIBLES.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label>Sobre mí</label>
                        <textarea
                          value={perfil.biografia}
                          onChange={e => setPerfil(p => ({ ...p, biografia: e.target.value }))}
                          rows={4}
                          placeholder="Contá algo sobre vos..."
                          maxLength={500}
                        />
                        <span className={styles.charCount}>{perfil.biografia.length}/500</span>
                      </div>

                      <div className={styles.formActions}>
                        <button
                          className={styles.btnCancelar}
                          onClick={() => setEditando(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          className={styles.btnGuardar}
                          onClick={handleGuardar}
                          disabled={guardando}
                        >
                          {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Modo vista */
                    <div className={styles.infoVista}>
                      {perfil.decada && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoRowIcon}>📍</span>
                          <span>Nací en la {perfil.decada.toLowerCase()}</span>
                        </div>
                      )}
                      {perfil.idioma && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoRowIcon}>💬</span>
                          <span>Habla {perfil.idioma.toLowerCase()}</span>
                        </div>
                      )}
                      <div className={styles.infoRow}>
                        <span className={styles.infoRowIcon}>🛡️</span>
                        <span className={perfil.identidadVerificada ? styles.verificado : styles.noVerificado}>
                          {perfil.identidadVerificada ? 'Identidad verificada' : 'Identidad no verificada'}
                        </span>
                      </div>
                      {perfil.biografia && (
                        <div className={styles.biografiaSection}>
                          <hr className={styles.divider} />
                          <p className={styles.biografia}>{perfil.biografia}</p>
                        </div>
                      )}
                      {!perfil.biografia && !perfil.decada && !perfil.idioma && (
                        <div className={styles.emptyInfo}>
                          <p>Completá tu perfil para que otros usuarios te conozcan mejor.</p>
                          <button
                            className={styles.btnEditarInline}
                            onClick={() => setEditando(true)}
                          >
                            Completar perfil →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Sección: Cuenta ── */}
          {seccion === 'cuenta' && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Configuración de la cuenta</h2>
              <p className={styles.seccionDesc}>
                Administrá tu información personal y preferencias de cuenta.
              </p>

              <div className={styles.configList}>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Nombre legal</h3>
                    <p>{perfil.displayName || 'No proporcionado'}</p>
                  </div>
                  <button className={styles.btnEditar} onClick={() => setSeccion('info')}>
                    Editar
                  </button>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Dirección de correo electrónico</h3>
                    <p>{perfil.email}</p>
                  </div>
                  <span className={styles.configTag}>Verificado</span>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Número de teléfono</h3>
                    <p>{perfil.telefono || 'No proporcionado'}</p>
                  </div>
                  <button
                    className={styles.btnEditar}
                    onClick={() => {
                      const tel = prompt('Ingresá tu número de teléfono:', perfil.telefono)
                      if (tel !== null) {
                        setPerfil(p => ({ ...p, telefono: tel }))
                        firestoreSet('users', user.uid, { ...perfil, telefono: tel })
                          .then(() => showToast('✅ Teléfono actualizado'))
                      }
                    }}
                  >
                    {perfil.telefono ? 'Editar' : 'Agregar'}
                  </button>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Verificación de identidad</h3>
                    <p>{perfil.identidadVerificada ? 'Verificada ✓' : 'No verificada'}</p>
                  </div>
                  {!perfil.identidadVerificada && (
                    <a
                      href="https://wa.me/59895532294?text=Hola!%20Quiero%20verificar%20mi%20identidad%20en%20Alquilala"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnEditar}
                    >
                      Verificar
                    </a>
                  )}
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Dirección</h3>
                    <p>{perfil.ubicacion || 'No proporcionada'}</p>
                  </div>
                  <button className={styles.btnEditar} onClick={() => setSeccion('info')}>
                    {perfil.ubicacion ? 'Editar' : 'Agregar'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ── Sección: Seguridad ── */}
          {seccion === 'seguridad' && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Inicio de sesión y seguridad</h2>
              <p className={styles.seccionDesc}>
                Actualizá tu contraseña y asegurá tu cuenta.
              </p>

              <div className={styles.configList}>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Contraseña</h3>
                    <p>Última actualización: hace más de un año</p>
                  </div>
                  <button
                    className={styles.btnEditar}
                    onClick={() => showToast('📧 Te enviamos un email para cambiar la contraseña')}
                  >
                    Actualizar
                  </button>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Cuenta de Google</h3>
                    <p>{user?.providerData?.[0]?.providerId === 'google.com' ? 'Conectada ✓' : 'No conectada'}</p>
                  </div>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Dispositivos activos</h3>
                    <p>Sesión activa en este dispositivo</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── Sección: Notificaciones ── */}
          {seccion === 'notificaciones' && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Notificaciones</h2>
              <p className={styles.seccionDesc}>
                Elegí cómo y cuándo querés recibir actualizaciones.
              </p>

              <div className={styles.configList}>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Notificaciones por email</h3>
                    <p>Recibí actualizaciones de tus reservas y propiedades</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={config.notificacionesEmail}
                      onChange={e => {
                        const val = e.target.checked
                        setConfig(c => ({ ...c, notificacionesEmail: val }))
                        firestoreSet('users', user.uid, { ...perfil, ...config, notificacionesEmail: val })
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Notificaciones por WhatsApp</h3>
                    <p>Recibí avisos importantes por WhatsApp</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={config.notificacionesWA}
                      onChange={e => {
                        const val = e.target.checked
                        setConfig(c => ({ ...c, notificacionesWA: val }))
                        firestoreSet('users', user.uid, { ...perfil, ...config, notificacionesWA: val })
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* ── Sección: Privacidad ── */}
          {seccion === 'privacidad' && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>Privacidad</h2>
              <p className={styles.seccionDesc}>
                Controlá qué información es visible para otros usuarios.
              </p>

              <div className={styles.configList}>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Perfil público</h3>
                    <p>Otros usuarios pueden ver tu nombre y foto</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={config.perfilPublico}
                      onChange={e => {
                        const val = e.target.checked
                        setConfig(c => ({ ...c, perfilPublico: val }))
                        firestoreSet('users', user.uid, { ...perfil, ...config, perfilPublico: val })
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <h3>Eliminar cuenta</h3>
                    <p>Esta acción es permanente e irreversible</p>
                  </div>
                  <button
                    className={styles.btnDanger}
                    onClick={() => {
                      if (confirm('¿Estás seguro? Esta acción eliminará tu cuenta permanentemente.')) {
                        showToast('Contactanos por WhatsApp para eliminar tu cuenta')
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default function Perfil() {
  return (
    <ProtectedRoute>
      <PerfilContenido />
    </ProtectedRoute>
  )
}