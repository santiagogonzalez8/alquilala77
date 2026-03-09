// ============================================================
//  LÓGICA DE TEMPORADAS Y PRECIOS
// ============================================================

export const TEMPORADAS = {
  alta: {
    label: 'Temporada alta',
    color: '#ef4444',
    bg: '#fee2e2',
    descripcion: 'Diciembre, enero, febrero, semana de turismo',
  },
  media: {
    label: 'Temporada media',
    color: '#f59e0b',
    bg: '#fff3e0',
    descripcion: 'Julio, semana santa, fines de semana largos',
  },
  baja: {
    label: 'Temporada baja',
    color: '#22c55e',
    bg: '#d1fae5',
    descripcion: 'Resto del año',
  },
}

// Determinar temporada de una fecha string "YYYY-MM-DD"
export function getTemporada(fechaStr) {
  if (!fechaStr) return 'baja'
  const fecha = new Date(fechaStr)
  const mes = fecha.getMonth() + 1 // 1-12
  const dia = fecha.getDate()

  // Semana de turismo: 14-21 abril aprox (simplificado)
  const esSemanaTurismo = mes === 4 && dia >= 13 && dia <= 21

  // Semana santa: última semana de marzo/primera de abril (simplificado)
  const esSemanaSanta = (mes === 3 && dia >= 24) || (mes === 4 && dia <= 6)

  // Temporada alta: dic, ene, feb + semana turismo
  if (mes === 12 || mes === 1 || mes === 2 || esSemanaTurismo) {
    return 'alta'
  }

  // Temporada media: julio + semana santa + fines de semana largos
  if (mes === 7 || esSemanaSanta) {
    return 'media'
  }

  return 'baja'
}

// Calcular precio de una noche según temporada
export function getPrecioNoche(fecha, precios) {
  const temporada = getTemporada(fecha)
  const precio = precios[temporada] || precios.baja || 0
  return Number(precio)
}

// Calcular precio total de un rango de fechas
export function calcularPrecioTotal(fechaInicio, fechaFin, precios) {
  if (!fechaInicio || !fechaFin) return { total: 0, desglose: [] }

  const desglose = []
  let total = 0
  const d = new Date(fechaInicio)
  const fin = new Date(fechaFin)

  while (d < fin) {
    const str = d.toISOString().split('T')[0]
    const temporada = getTemporada(str)
    const precio = getPrecioNoche(str, precios)
    total += precio
    desglose.push({ fecha: str, temporada, precio })
    d.setDate(d.getDate() + 1)
  }

  // Agrupar por temporada para el resumen
  const resumen = {}
  for (const item of desglose) {
    if (!resumen[item.temporada]) {
      resumen[item.temporada] = { noches: 0, precioNoche: item.precio, subtotal: 0 }
    }
    resumen[item.temporada].noches++
    resumen[item.temporada].subtotal += item.precio
  }

  return { total, desglose, resumen }
}

// Precio mínimo de noches según temporada
export function getMinNoches(temporada, config) {
  if (!config) return 1
  return config[`minNoches_${temporada}`] || config.minNoches || 1
}