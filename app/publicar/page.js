'use client';

import { useState } from 'react';
import { auth, storage, firestoreAdd } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './publicar.module.css';

function PublicarContenido() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    titulo: '', ubicacion: '', precioPorNoche: '', descripcion: '',
    huespedes: '', dormitorios: '', camas: '', banos: '',
    tipoPropiedad: 'Casa', amenities: []
  });
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [etapa, setEtapa] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const amenitiesDisponibles = [
    'Piscina', 'Vista a la playa', 'WiFi', 'Aire acondicionado',
    'Parrillero', 'Estacionamiento', 'Cocina equipada', 'TV',
    'Jardín', 'Terraza', 'Lavadora', 'Secadora'
  ];

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFotos(prev => [...prev, ...files.map(file => ({
      file, preview: URL.createObjectURL(file), id: Math.random().toString(36)
    }))]);
  };

  const eliminarFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));
  const handleDragStart = (e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const n = [...fotos]; const d = n[draggedIndex]; n.splice(draggedIndex, 1); n.splice(dropIndex, 0, d);
    setFotos(n); setDraggedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const user = auth.currentUser;
    if (!user) { router.push('/login'); return; }

    setLoading(true);
    setProgreso(5);
    setEtapa('Preparando...');

    try {
      let fotosURLs = [];

      if (fotos.length > 0) {
        setEtapa('Subiendo fotos...');
        for (let i = 0; i < fotos.length; i++) {
          setProgreso(Math.round((i / fotos.length) * 80) + 5);
          try {
            const foto = fotos[i];
            const fileName = `propiedades/${user.uid}/${Date.now()}_${i}.jpg`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, foto.file);
            const url = await getDownloadURL(storageRef);
            fotosURLs.push(url);
          } catch (err) {
            console.error(`Foto ${i + 1} falló:`, err.message);
          }
        }
        setProgreso(85);
      } else {
        setProgreso(50);
      }

      setEtapa('Publicando...');
      setProgreso(90);

      await firestoreAdd('propiedades', {
        titulo: formData.titulo,
        ubicacion: formData.ubicacion,
        precioPorNoche: formData.precioPorNoche,
        descripcion: formData.descripcion,
        huespedes: formData.huespedes,
        dormitorios: formData.dormitorios,
        camas: formData.camas,
        banos: formData.banos,
        tipoPropiedad: formData.tipoPropiedad,
        amenities: formData.amenities,
        imagenes: fotosURLs,
        fotoPrincipal: fotosURLs[0] || '',
        userId: user.uid,
        userEmail: user.email || '',
        fechaPublicacion: new Date().toISOString(),
        estado: 'pendiente',
        temporada: 'verano',
      });

      setProgreso(100);
      setEtapa('¡Publicada!');
      setShowSuccess(true);
      setTimeout(() => router.push('/mis-propiedades'), 2000);

    } catch (error) {
      console.error('ERROR:', error);
      setErrorMsg(`Error: ${error.message}`);
      setProgreso(0);
      setEtapa('');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className={styles.page}>
      {showSuccess && (
        <div className={styles.toast}>✅ ¡Propiedad enviada para revisión! Redirigiendo...</div>
      )}

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="section-label">Nuevo</span>
          <h1 className={styles.headerTitle}>Publicá tu propiedad</h1>
          <p className={styles.headerSubtitle}>Completá los datos y nosotros nos encargamos de publicarla en Airbnb, Booking y MercadoLibre.</p>
        </div>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.formCard}>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📷 Fotos de la propiedad</h2>
            <p className={styles.sectionHint}>Opcional. La primera será la portada.</p>
            {fotos.length > 0 && (
              <div className={styles.photosGrid}>
                {fotos.map((foto, index) => (
                  <div key={foto.id} draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={styles.photoItem}
                    style={{ opacity: draggedIndex === index ? 0.5 : 1 }}>
                    <img src={foto.preview} alt={`Foto ${index + 1}`} />
                    {index === 0 && <div className={styles.photoBadge}>PORTADA</div>}
                    <div className={styles.photoNumber}>{index + 1}</div>
                    <button type="button" onClick={() => eliminarFoto(foto.id)} className={styles.photoDelete}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label className={styles.uploadArea}>
              {fotos.length === 0 ? '📷 Hacé clic para agregar fotos' : `📷 Agregar más (${fotos.length})`}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🏠 Datos de la propiedad</h2>
            <div className={styles.formGroup}>
              <label>Título *</label>
              <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ej: Casa en Punta Negra para 6 personas con piscina" />
            </div>
            <div className={styles.formGroup}>
              <label>Ubicación *</label>
              <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} required placeholder="Ej: Punta Negra, Maldonado" />
            </div>
            <div className={styles.formGroup}>
              <label>Tipo *</label>
              <select name="tipoPropiedad" value={formData.tipoPropiedad} onChange={handleChange}>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Cabaña">Cabaña</option>
                <option value="Chalet">Chalet</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Precio/noche (USD) *</label>
                <input type="number" name="precioPorNoche" value={formData.precioPorNoche} onChange={handleChange} required min="1" placeholder="250" />
              </div>
              <div className={styles.formGroup}>
                <label>Huéspedes *</label>
                <input type="number" name="huespedes" value={formData.huespedes} onChange={handleChange} required min="1" placeholder="6" />
              </div>
            </div>
            <div className={styles.formRow3}>
              <div className={styles.formGroup}>
                <label>Dormitorios *</label>
                <input type="number" name="dormitorios" value={formData.dormitorios} onChange={handleChange} required min="1" placeholder="3" />
              </div>
              <div className={styles.formGroup}>
                <label>Camas *</label>
                <input type="number" name="camas" value={formData.camas} onChange={handleChange} required min="1" placeholder="4" />
              </div>
              <div className={styles.formGroup}>
                <label>Baños *</label>
                <input type="number" name="banos" value={formData.banos} onChange={handleChange} required min="1" placeholder="2" />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>✨ Amenidades</h2>
            <div className={styles.amenitiesGrid}>
              {amenitiesDisponibles.map(amenity => (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                  className={`${styles.amenityBtn} ${formData.amenities.includes(amenity) ? styles.amenityActive : ''}`}>
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📝 Descripción</h2>
            <div className={styles.formGroup}>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required rows="5"
                placeholder="Describí tu propiedad: ubicación, características, qué incluye..." />
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: '#ffebee', border: '2px solid #ef5350', borderRadius: '8px',
              padding: '1rem', marginBottom: '1rem', color: '#c62828', fontWeight: 600, fontSize: '0.9rem'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {loading && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                <span>{etapa}</span><span>{progreso}%</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: '#e8e8e8', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progreso}%`, height: '100%',
                  background: progreso === 100 ? 'var(--color-success)' : 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                  borderRadius: '7px', transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.btnSubmit}>
            {loading ? (etapa || 'Publicando...') : 'Enviar para revisión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PublicarPropiedad() {
  return (
    <ProtectedRoute>
      <PublicarContenido />
    </ProtectedRoute>
  );
}