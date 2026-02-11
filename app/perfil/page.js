'use client'

import { useState, useEffect } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updatePassword } from 'firebase/auth'
import styles from './perfil.module.css'

export default function Perfil() {
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    photoURL: ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    if (!auth.currentUser) return

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      } else {
        const initialData = {
          displayName: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
          phone: '',
          location: '',
          bio: '',
          photoURL: auth.currentUser.photoURL || ''
        }
        setUserData(initialData)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe ser menor a 2MB')
      return
    }

    setUploading(true)
    try {
      const storageRef = ref(storage, `profile-photos/${auth.currentUser.uid}`)
      await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(storageRef)
      
      const newData = { ...userData, photoURL }
      setUserData(newData)
      
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...newData,
        updatedAt: new Date()
      })
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir la foto')
    }
    setUploading(false)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...userData,
        updatedAt: new Date()
      })
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      await loadUserData()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      alert('Mínimo 6 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    try {
      await updatePassword(auth.currentUser, newPassword)
      
      setShowPasswordSuccess(true)
      setTimeout(() => setShowPasswordSuccess(false), 3000)
      
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error:', error)
      alert('Error. Vuelve a iniciar sesión.')
    }
  }

  const getInitials = () => {
    return userData.displayName ? userData.displayName.charAt(0).toUpperCase() : 'U'
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Mi Perfil</h1>

        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#10b981',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold'
          }}>
            ✅ Perfil actualizado
          </div>
        )}

        {showPasswordSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#10b981',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold'
          }}>
            ✅ Contraseña actualizada
          </div>
        )}

        <div className={styles.photoSection}>
          <div className={styles.photo}>
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="Perfil" />
            ) : (
              <div className={styles.initials}>{getInitials()}</div>
            )}
          </div>
          <div>
            <label htmlFor="photo-upload" className={styles.btnPhoto}>
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <p className={styles.hint}>400×400px, máx 2MB</p>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Información Personal</h3>
          <form onSubmit={handleSaveProfile}>
            <div className={styles.formGroup}>
              <label>Nombre completo *</label>
              <input
                type="text"
                name="displayName"
                value={userData.displayName}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Correo electrónico *</label>
              <input
                type="email"
                value={userData.email}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label>Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={userData.phone}
                onChange={handleChange}
                placeholder="+598 99 123 456"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ubicación</label>
              <input
                type="text"
                name="location"
                value={userData.location}
                onChange={handleChange}
                placeholder="Montevideo, Uruguay"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Sobre mí</label>
              <textarea
                name="bio"
                value={userData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Cuéntanos sobre ti..."
              />
            </div>

            <button type="submit" className={styles.btnSave}>
              Guardar Cambios
            </button>
          </form>
        </div>

        <div className={styles.section}>
          <h3>Cambiar Contraseña</h3>
          <form onSubmit={handleChangePassword}>
            <div className={styles.formGroup}>
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
              />
            </div>

            <button type="submit" className={styles.btnSave}>
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}