'use client'

import { useEffect, useState } from 'react'
import styles from './MapaPropiedades.module.css'

// Coordenadas de ciudades de Uruguay para geocoding básico
const COORDENADAS_UY = {
  'montevideo': [-34.9011, -56.1645],
  'punta del este': [-34.9667, -54.95],
  'punta del este, uruguay': [-34.9667, -54.95],
  'maldonado': [-34.9011, -54.9611],
  'colonia': [-34.4626, -57.8400],
  'colonia del sacramento': [-34.4626, -57.8400],
  'la paloma': [-34.6667, -54.1667],
  'la pedrera': [-34.5833, -54.1000],
  'cabo polonio': [-34.4000, -53.7833],
  'piriápolis': [-34.8667, -55.2833],
  'piriapolis': [-34.8667, -55.2833],
  'atlantida': [-34.7667, -55.7667],
  'atlántida': [-34.7667, -55.7667],
  'salinas': [-34.8333, -55.8833],
  'canelones': [-34.5167, -56.2833],
  'las piedras': [-34.7333, -56.2167],
  'ciudad de la costa': [-34.8333, -56.0667],
  'solymar': [-34.8000, -55.9833],
  'parque del plata': [-34.8000, -55.9167],
  'rocha': [-34.4833, -54.3333],
  'chuy': [-33.6833, -53.4667],
  'salto': [-31.3833, -57.9500],
  'rivera': [-30.9000, -55.5333],
  'tacuarembó': [-31.7167, -55.9833],
  'minas': [-34.3667, -55.2333],
  'treinta y tres': [-33.2333, -54.3833],
  'mercedes': [-33.2500, -58.0167],
  'fray bentos': [-33.1167, -58.3000],
  'nueva helvecia': [-34.2833, -57.2000],
  'santa teresa': [-33.9500, -53.5333],
  'la coronilla': [-33.8833, -53.5167],
  'barra de valizas': [-34.3000, -53.7833],
  'aguas dulces': [-34.2667, -53.5667],
  'punta ballena': [-34.9333, -55.1000],
  'jose ignacio': [-34.8500, -54.6667],
  'josé ignacio': [-34.8500, -54.6667],
  'la barra': [-34.9167, -54.8333],
  'manantiales': [-34.9000, -54.8000],
  'montevideo, uruguay': [-34.9011, -56.1645],
}

function getCoordenadasAproximadas(ubicacion) {
  if (!ubicacion) return null
  const lower = ubicacion.toLowerCase().trim()

  // Buscar coincidencia exacta o parcial
  for (const [key, coords] of Object.entries(COORDENADAS_UY)) {
    if (lower.includes(key) || key.includes(lower)) {
      // Agregar pequeña variación aleatoria para que no se superpongan
      const offset = () => (Math.random() - 0.5) * 0.01
      return [coords[0] + offset(), coords[1] + offset()]
    }
  }

  // Default: Uruguay centro
  return [-32.5228, -55.7658]
}

export default function MapaPropiedades({ propiedades = [], altura = '500px' }) {
  const [MapComponents, setMapComponents] = useState(null)
  const [propSeleccionada, setPropSeleccionada] = useState(null)

  useEffect(() => {
    // Importar Leaflet solo en el cliente
    const cargarMapa = async () => {
      const L = await import('leaflet')
      const { MapContainer, TileLayer, Marker, Popup, useMap } = await import('react-leaflet')

      // Fix para iconos de Leaflet en Next.js
      delete L.default.Icon.Default.prototype._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Ícono personalizado azul
      const iconoAzul = L.default.divIcon({
        html: `
          <div style="
            background: #1e3a5f;
            color: white;
            border-radius: 50% 50% 50% 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 700;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg)">🏠</span>
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      // Ícono seleccionado naranja
      const iconoSeleccionado = L.default.divIcon({
        html: `
          <div style="
            background: #c9965a;
            color: white;
            border-radius: 50% 50% 50% 0;
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            font-weight: 700;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          ">
            <span style="transform: rotate(45deg)">🏠</span>
          </div>
        `,
        className: '',
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -42],
      })

      setMapComponents({ MapContainer, TileLayer, Marker, Popup, L, iconoAzul, iconoSeleccionado })
    }

    cargarMapa()
  }, [])

  const propsConCoords = propiedades
    .filter(p => p.estado === 'disponible')
    .map(p => ({
      ...p,
      coords: getCoordenadasAproximadas(p.ubicacion),
    }))
    .filter(p => p.coords)

  if (!MapComponents) {
    return (
      <div className={styles.mapaLoading} style={{ height: altura }}>
        <div className="loading-spinner" />
        <p>Cargando mapa...</p>
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker, Popup, iconoAzul, iconoSeleccionado } = MapComponents

  // Centro del mapa: Uruguay
  const centro = [-32.5228, -55.7658]

  return (
    <div className={styles.mapaWrapper}>
      <div className={styles.mapaContenedor} style={{ height: altura }}>
        <MapContainer
          center={centro}
          zoom={7}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {propsConCoords.map(prop => (
            <Marker
              key={prop.id}
              position={prop.coords}
              icon={propSeleccionada?.id === prop.id ? iconoSeleccionado : iconoAzul}
              eventHandlers={{
                click: () => setPropSeleccionada(prop),
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px', fontFamily: 'inherit' }}>
                  {(prop.imagenes?.[0] || prop.fotoPrincipal) && (
                    <img
                      src={prop.imagenes?.[0] || prop.fotoPrincipal}
                      alt={prop.titulo}
                      style={{
                        width: '100%', height: '120px',
                        objectFit: 'cover', borderRadius: '6px',
                        marginBottom: '0.5rem',
                      }}
                    />
                  )}
                  <h3 style={{
                    fontSize: '0.9rem', fontWeight: 700,
                    color: '#1e3a5f', margin: '0 0 0.25rem',
                  }}>
                    {prop.titulo}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 0.5rem' }}>
                    📍 {prop.ubicacion}
                  </p>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '0.5rem',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: '#666' }}>
                      👥 {prop.huespedes} · 🛏️ {prop.dormitorios}
                    </span>
                    <span style={{
                      fontWeight: 800, color: '#1e3a5f', fontSize: '0.95rem',
                    }}>
                      ${prop.precioPorNoche}/noche
                    </span>
                  </div>
                  <a
                    href={`/propiedades/${prop.id}`}
                    style={{
                      display: 'block', background: '#1e3a5f', color: 'white',
                      textAlign: 'center', padding: '0.5rem', borderRadius: '6px',
                      textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
                    }}
                  >
                    Ver propiedad →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Lista lateral */}
      {propSeleccionada && (
        <div className={styles.propCard}>
          <button
            className={styles.propCardClose}
            onClick={() => setPropSeleccionada(null)}
          >✕</button>
          {(propSeleccionada.imagenes?.[0] || propSeleccionada.fotoPrincipal) && (
            <img
              src={propSeleccionada.imagenes?.[0] || propSeleccionada.fotoPrincipal}
              alt={propSeleccionada.titulo}
              className={styles.propCardImg}
            />
          )}
          <div className={styles.propCardBody}>
            <h3 className={styles.propCardTitulo}>{propSeleccionada.titulo}</h3>
            <p className={styles.propCardUbicacion}>📍 {propSeleccionada.ubicacion}</p>
            <div className={styles.propCardDetalles}>
              <span>👥 {propSeleccionada.huespedes} huéspedes</span>
              <span>🛏️ {propSeleccionada.dormitorios} dorm.</span>
              <span>🚿 {propSeleccionada.banos} baños</span>
            </div>
            <div className={styles.propCardFooter}>
              <span className={styles.propCardPrecio}>
                ${propSeleccionada.precioPorNoche}
                <span className={styles.propCardPrecioLabel}> USD/noche</span>
              </span>
              <a
                href={`/propiedades/${propSeleccionada.id}`}
                className={styles.propCardBtn}
              >
                Ver →
              </a>
            </div>
          </div>
        </div>
      )}

      {propsConCoords.length === 0 && (
        <div className={styles.mapaEmpty}>
          <p>No hay propiedades disponibles para mostrar en el mapa.</p>
        </div>
      )}
    </div>
  )
}