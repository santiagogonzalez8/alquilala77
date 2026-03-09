'use client'

import { useState, useEffect } from 'react'
import { firestoreGetAll, firestoreUpdate } from '@/lib/firebase'
import styles from './AdminCalendario.module.css'

function calcularRango(desde, hasta) {
  const fechas = []
  const d = new Date(desde)
  const fin = new Date(hasta)
  while (d <= fin) {
    fechas.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }
  return fechas
}

function MesCalendario({ year, month, fechasOcupadas, onToggle, propiedadId }) {
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const primerDia = new Date(year, month, 1).getDay()

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const toStr = (dia) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

  const diasSemana = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  const celdas = []
  for (let i = 0; i < primerDia; i++) {
    celdas.push(<div key={`e-${i}`} className={styles.celda} />)
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const str = toStr(dia)
    const ocupado = fechasOcupadas.includes(str)
    const pasado = str < hoyStr
    const esHoy = str === hoyStr

    celdas.push(
      <div
        key={dia}
        className={[
          styles.celda,
          pasado ? styles.pasado : '',
          ocupado && !pasado ? styles.ocupado : '',
          ocupado && pasado ? styles.ocupadoPasado : '',
          esHoy ? styles.hoy : '',
          !pasado ? styles.clickeable : '',
        ].join(' ')}
        onClick={() => !pasado && onToggle(str)}
        title={pasado ? '' : ocupado ? 'Click para marcar disponible' : 'Click para marcar ocupado'}
      >
        {dia}
      </div>
    )
  }

  return (
    <div className={styles.mesWrapper}>
      <h4 className={styles.mesTitulo}>{meses[month]} {year}</h4>
      <div className={styles.calGrid}>
        {diasSemana.map(d => (
          <div key={d} className={styles.diaSemana}>{d}</div>
        ))}
        {celdas}
      </div>
    </div>
  )
}

export default function AdminCalendario({ propiedades, onRefresh }) {
  const [propSeleccionada, setPropSeleccionada] = useState(null)
  const [fechasOcupadas, setFechasOcupadas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date()
    return { year: hoy.getFullYear(), month: hoy.getMonth() }
  })
  const [modoRango, setModoRango] = useState(false)
  const [rangoInicio, setRangoInicio] = useState('')
  const [rangoFin, setRangoFin] = useState('')

  const hoy = new Date()

  useEffect(() => {
    if (propSeleccionada) {
      setFechasOcupadas(propSeleccionada.fechasOcupadas || [])
    }
  }, [propSeleccionada])

  const toggleFecha = (fecha) => {
    setFechasOcupadas(prev =>
      prev.includes(fecha)
        ? prev.filter(f => f !== fecha)
        : [...prev, fecha].sort()
    )
  }

  const aplicarRango = (ocupar) => {
    if (!rangoInicio || !rangoFin) return
    const [a, b] = rangoInicio <= rangoFin
      ? [rangoInicio, rangoFin]
      : [rangoFin, rangoInicio]
    const rango = calcularRango(a, b)

    if (ocupar) {
      setFechasOcupadas(prev => [...new Set([...prev, ...rango])].sort())
    } else {
      setFechasOcupadas(prev => prev.filter(f => !rango.includes(f)))
    }
    setRangoInicio('')
    setRangoFin('')
    showToast(`${ocupar ? '🔴' : '🟢'} ${rango.length} días ${ocupar ? 'marcados ocupados' : 'liberados'}`)
  }

  const limpiarTodo = () => {
    if (!confirm('¿Limpiar todas las fechas ocupadas futuras?')) return
    const hoyStr = hoy.toISOString().split('T')[0]
    setFechasOcupadas(prev => prev.filter(f => f < hoyStr))
    showToast('✅ Fechas futuras limpiadas')
  }

  const guardar = async () => {
    if (!propSeleccionada) return
    setGuardando(true)
    try {
      await firestoreUpdate('propiedades', propSeleccionada.id, {
        fechasOcupadas,
      })
      showToast('✅ Calendario guardado correctamente')
      onRefresh()
      // Actualizar prop seleccionada localmente
      setPropSeleccionada(prev => ({ ...prev, fechasOcupadas }))
    } catch (err) {
      showToast('❌ Error al guardar')
      console.error(err)
    } finally {
      setGuardando(false)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const prevMes = () => {
    setMesActual(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const nextMes = () => {
    setMesActual(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const mesNext = mesActual.month === 11
    ? { year: mesActual.year + 1, month: 0 }
    : { year: mesActual.year, month: mesActual.month + 1 }

  const puedeRetroceder =
    mesActual.year > hoy.getFullYear() ||
    (mesActual.year === hoy.getFullYear() && mesActual.month > hoy.getMonth())

  const fechasFuturas = fechasOcupadas.filter(
    f => f >= hoy.toISOString().split('T')[0]
  )

  return (
    <div className={styles.wrapper}>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.header}>
        <h2 className={styles.titulo}>📅 Calendarios de Disponibilidad</h2>
        <p className={styles.subtitulo}>
          Marcá los días ocupados de cada propiedad. Los huéspedes verán estos días bloqueados.
        </p>
      </div>

      <div className={styles.layout}>

        {/* Lista de propiedades */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitulo}>Propiedades</h3>
          <div className={styles.propList}>
            {propiedades.length === 0 ? (
              <p className={styles.empty}>No hay propiedades</p>
            ) : (
              propiedades.map(prop => (
                <button
                  key={prop.id}
                  className={`${styles.propItem} ${propSeleccionada?.id === prop.id ? styles.propItemActivo : ''}`}
                  onClick={() => setPropSeleccionada(prop)}
                >
                  {(prop.imagenes?.[0] || prop.fotoPrincipal) && (
                    <img
                      src={prop.imagenes?.[0] || prop.fotoPrincipal}
                      alt=""
                      className={styles.propThumb}
                    />
                  )}
                  <div className={styles.propInfo}>
                    <p className={styles.propNombre}>{prop.titulo}</p>
                    <p className={styles.propUbicacion}>{prop.ubicacion}</p>
                    <p className={styles.propFechas}>
                      {(prop.fechasOcupadas?.length || 0)} días ocupados
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Calendario */}
        <div className={styles.calContent}>
          {!propSeleccionada ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3>Seleccioná una propiedad</h3>
              <p>Elegí una propiedad de la lista para gestionar su calendario</p>
            </div>
          ) : (
            <>
              {/* Header propiedad */}
              <div className={styles.propHeader}>
                <div>
                  <h3 className={styles.propTitulo}>{propSeleccionada.titulo}</h3>
                  <p className={styles.propSubtitulo}>
                    📍 {propSeleccionada.ubicacion} •
                    <span className={styles.ocupadasCount}>
                      {' '}{fechasFuturas.length} días ocupados próximamente
                    </span>
                  </p>
                </div>
                <div className={styles.headerActions}>
                  <button
                    className={styles.btnLimpiar}
                    onClick={limpiarTodo}
                  >
                    🧹 Limpiar futuras
                  </button>
                  <button
                    className={styles.btnGuardar}
                    onClick={guardar}
                    disabled={guardando}
                  >
                    {guardando ? '⏳ Guardando...' : '💾 Guardar'}
                  </button>
                </div>
              </div>

              {/* Modo rango */}
              <div className={styles.rangoSection}>
                <button
                  className={`${styles.btnRango} ${modoRango ? styles.btnRangoActivo : ''}`}
                  onClick={() => setModoRango(!modoRango)}
                >
                  📆 {modoRango ? 'Ocultar' : 'Marcar rango de fechas'}
                </button>

                {modoRango && (
                  <div className={styles.rangoForm}>
                    <div className={styles.rangoInputs}>
                      <div>
                        <label>Desde</label>
                        <input
                          type="date"
                          value={rangoInicio}
                          min={hoy.toISOString().split('T')[0]}
                          onChange={e => setRangoInicio(e.target.value)}
                          className={styles.dateInput}
                        />
                      </div>
                      <div>
                        <label>Hasta</label>
                        <input
                          type="date"
                          value={rangoFin}
                          min={rangoInicio || hoy.toISOString().split('T')[0]}
                          onChange={e => setRangoFin(e.target.value)}
                          className={styles.dateInput}
                        />
                      </div>
                    </div>
                    {rangoInicio && rangoFin && (
                      <div className={styles.rangoBtns}>
                        <button
                          className={styles.btnOcupar}
                          onClick={() => aplicarRango(true)}
                        >
                          🔴 Marcar ocupado
                        </button>
                        <button
                          className={styles.btnLiberar}
                          onClick={() => aplicarRango(false)}
                        >
                          🟢 Marcar disponible
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navegación meses */}
              <div className={styles.calNav}>
                <button
                  className={styles.calNavBtn}
                  onClick={prevMes}
                  disabled={!puedeRetroceder}
                >‹</button>
                <span className={styles.calNavLabel}>
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][mesActual.month]
                  } {mesActual.year}
                  {' — '}
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][mesNext.month]
                  } {mesNext.year}
                </span>
                <button className={styles.calNavBtn} onClick={nextMes}>›</button>
              </div>

              {/* Dos meses */}
              <div className={styles.dosMeses}>
                <MesCalendario
                  year={mesActual.year}
                  month={mesActual.month}
                  fechasOcupadas={fechasOcupadas}
                  onToggle={toggleFecha}
                  propiedadId={propSeleccionada.id}
                />
                <MesCalendario
                  year={mesNext.year}
                  month={mesNext.month}
                  fechasOcupadas={fechasOcupadas}
                  onToggle={toggleFecha}
                  propiedadId={propSeleccionada.id}
                />
              </div>

              {/* Leyenda */}
              <div className={styles.leyenda}>
                <div className={styles.leyendaItem}>
                  <div className={`${styles.leyendaDot} ${styles.dotDisponible}`} />
                  <span>Disponible</span>
                </div>
                <div className={styles.leyendaItem}>
                  <div className={`${styles.leyendaDot} ${styles.dotOcupado}`} />
                  <span>Ocupado</span>
                </div>
                <div className={styles.leyendaItem}>
                  <div className={`${styles.leyendaDot} ${styles.dotPasado}`} />
                  <span>Pasado</span>
                </div>
                <div className={styles.leyendaItem}>
                  <div className={`${styles.leyendaDot} ${styles.dotHoy}`} />
                  <span>Hoy</span>
                </div>
              </div>

              {/* Fechas ocupadas próximas */}
              {fechasFuturas.length > 0 && (
                <div className={styles.fechasLista}>
                  <h4 className={styles.fechasListaTitulo}>
                    Próximas fechas ocupadas ({fechasFuturas.length})
                  </h4>
                  <div className={styles.fechasTags}>
                    {fechasFuturas.slice(0, 30).map(f => (
                      <span
                        key={f}
                        className={styles.fechaTag}
                        onClick={() => toggleFecha(f)}
                        title="Click para liberar"
                      >
                        {f} ✕
                      </span>
                    ))}
                    {fechasFuturas.length > 30 && (
                      <span className={styles.fechaTagMore}>
                        +{fechasFuturas.length - 30} más
                      </span>
                    )}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  )
}