'use client'

import { useState, useEffect } from 'react'
import { auth, storage, firestoreGetCollection, firestoreUpdate, firestoreAdd } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updatePassword, updateProfile } from 'firebase/auth'
import ProtectedRoute from '@/components/ProtectedRoute'
import styles from './perfil.module.css'

function PerfilContenido() {
  const [userData, setUserData] = useState({
    displayName: '', email: '', phone: '', location: '', bio: '', photoURL: ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => { loadUserData() }, [])

  const showToast = (msg, type = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 4000)
  }

  const loadUserData = async () => {
    if (!auth.currentUser) return
    try {
      // Usamos REST para leer el documento del usuario
      const users = await firestoreGetCollection('users', 'id', auth.currentUser.uid);
      
      if (users.length > 0) {
        setUserData(users[0])
      } else {
        const initial = {
          id: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
          phone: '', location: '', bio: '',
          photoURL: auth.currentUser.photoURL || ''
        }
        setUserData(initial)
        // Creamos si no existe
        await firestoreAdd('users', { ...initial, createdAt: new Date().toISOString() })
      }
    } catch (error) {
      console.error('Error cargando perfil:', error)
    }
  }

  const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value })

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('La imagen debe ser menor a 2MB', 'error'); return }

    setUploading(true)
    try {
      const storageRef = ref(storage, `profile-photos/${auth.currentUser.uid}_${Date.now()}`)
      await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(storageRef)
      await updateProfile(auth.currentUser, { photoURL })

      await firestoreUpdate('users', auth.currentUser.uid, { 
        photoURL, 
        updatedAt: new Date().toISOString() 
      })

      setUserData(prev => ({ ...prev, photoURL }))
      showToast('✅ Foto actualizada correctamente')
    } catch (error) {
      console.error('Error subiendo foto:', error)
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (userData.displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: userData.displayName })
      }

      const dataToSave = {
        displayName: userData.displayName,
        email: userData.email,
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || '',
        photoURL: userData.photoURL || '',
        updatedAt: new Date().toISOString()
      }

      await firestoreUpdate('users', auth.currentUser.uid, dataToSave)

      showToast('✅ Perfil guardado correctamente')
    } catch (error) {
      console.error('Error:', error)
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return }
    if (newPassword !== confirmPassword) { showToast('No coinciden', 'error'); return }

    setSavingPassword(true)
    try {
      await updatePassword(auth.currentUser, newPassword)
      showToast('✅ Contraseña actualizada')
      setNewPassword(''); setConfirmPassword('')
    } catch (error) {
      showToast(error.code === 'auth/requires-recent-login'
        ? 'Cerrá sesión y volvé a iniciar antes de cambiar contraseña' : `Error: ${error.message}`, 'error')
    } finally { setSavingPassword(false) }
  }

  const getInitials = () => userData.displayName ? userData.displayName.charAt(0).toUpperCase() : 'U'

  return (
    <div className={styles.page}>
      {toast && (
        <div className={styles.toast} style={{ background: toastType === 'error' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {toast}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="section-label">Mi cuenta</span>
          <h1 className={styles.headerTitle}>Mi Perfil</h1>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.photoSection}>
          <div className={styles.photo}>
            {userData.photoURL ? <img src={userData.photoURL} alt="Perfil" /> : <div className={styles.initials}>{getInitials()}</div>}
          </div>
          <div>
            <label htmlFor="photo-upload" className={styles.btnPhoto}>
              {uploading ? '⏳ Subiendo...' : '📷 Cambiar foto'}
            </label>
            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{ display: 'none' }} />
            <p className={styles.hint}>JPG o PNG, máx 2MB</p>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Información Personal</h3>
          <form onSubmit={handleSaveProfile}>
            <div className={styles.formGroup}><label>Nombre completo *</label>
              <input type="text" name="displayName" value={userData.displayName} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>Correo electrónico</label>
              <input type="email" value={userData.email} disabled /><p className={styles.hint}>No se puede cambiar</p></div>
            <div className={styles.formGroup}><label>Teléfono</label>
              <input type="tel" name="phone" value={userData.phone} onChange={handleChange} placeholder="+598 99 123 456" /></div>
            <div className={styles.formGroup}><label>Ubicación</label>
              <input type="text" name="location" value={userData.location} onChange={handleChange} placeholder="Montevideo, Uruguay" /></div>
            <div className={styles.formGroup}><label>Sobre mí</label>
              <textarea name="bio" value={userData.bio} onChange={handleChange} rows="4" placeholder="Contanos sobre vos..." /></div>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}</button>
          </form>
        </div>

        <div className={styles.section}>
          <h3>Cambiar Contraseña</h3>
          <form onSubmit={handleChangePassword}>
            <div className={styles.formGroup}><label>Nueva contraseña</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
            <div className={styles.formGroup}><label>Confirmar</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetí la contraseña" /></div>
            <button type="submit" className={styles.btnSave} disabled={savingPassword}>
              {savingPassword ? '⏳ Cambiando...' : '🔒 Cambiar Contraseña'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Perfil() {
  return (<ProtectedRoute><PerfilContenido /></ProtectedRoute>)
}