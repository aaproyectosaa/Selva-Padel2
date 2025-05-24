import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Constante para la zona horaria de Argentina (UTC-3)
 */
export const ARGENTINA_TIMEZONE_OFFSET = -3 * 60 // -3 horas en minutos

/**
 * Normaliza una fecha para Argentina (UTC-3)
 * Esta función garantiza que la fecha se maneje correctamente independientemente de la zona horaria del usuario
 *
 * @param date Fecha a normalizar (string o Date)
 * @returns Date normalizada para Argentina
 */
export const normalizarFechaArgentina = (date: string | Date | undefined | null): Date => {
  if (!date) return new Date()

  let fechaObj: Date

  // Si es string, convertir a Date
  if (typeof date === 'string') {
    // Si es formato ISO (yyyy-MM-dd)
    if (date.includes('-') && !date.includes('T')) {
      const [year, month, day] = date.split('-').map(Number)
      // Crear fecha con mediodía para evitar problemas de zona horaria
      return new Date(year, month - 1, day, 12, 0, 0)
    }

    // Si es formato ISO completo con T
    if (date.includes('T')) {
      const datePart = date.split('T')[0]
      const [year, month, day] = datePart.split('-').map(Number)
      // Crear fecha con mediodía para evitar problemas de zona horaria
      return new Date(year, month - 1, day, 12, 0, 0)
    }

    // Otros formatos
    fechaObj = new Date(date)
    if (!isValid(fechaObj)) {
      return new Date() // Fallback a fecha actual
    }
  } else {
    fechaObj = date
  }

  // Extraer componentes de la fecha
  const year = fechaObj.getFullYear()
  const month = fechaObj.getMonth()
  const day = fechaObj.getDate()

  // Crear nueva fecha con mediodía para evitar problemas de zona horaria
  return new Date(year, month, day, 12, 0, 0)
}

/**
 * Formatea una fecha para mostrar en la interfaz
 *
 * @param date Fecha a formatear
 * @param formatStr Formato a utilizar (por defecto: dd/MM/yyyy)
 * @returns String formateado
 */
export const formatearFecha = (
  date: Date | string | undefined | null,
  formatStr: string = 'dd/MM/yyyy'
): string => {
  if (!date) return ''

  const fechaNormalizada = normalizarFechaArgentina(date)
  return format(fechaNormalizada, formatStr, { locale: es })
}

/**
 * Convierte una fecha a formato ISO (yyyy-MM-dd) para usar en inputs de tipo date
 *
 * @param date Fecha a convertir
 * @returns String en formato ISO (yyyy-MM-dd)
 */
export const fechaToISOString = (date: Date | string | undefined | null): string => {
  if (!date) return ''

  const fechaNormalizada = normalizarFechaArgentina(date)
  return format(fechaNormalizada, 'yyyy-MM-dd')
}

/**
 * Compara dos fechas ignorando la hora
 *
 * @param date1 Primera fecha
 * @param date2 Segunda fecha
 * @returns true si las fechas son iguales, false en caso contrario
 */
export const sonFechasIguales = (
  date1: Date | string | undefined | null,
  date2: Date | string | undefined | null
): boolean => {
  if (!date1 || !date2) return false

  const fecha1 = normalizarFechaArgentina(date1)
  const fecha2 = normalizarFechaArgentina(date2)

  return (
    fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getDate() === fecha2.getDate()
  )
}

/**
 * Obtiene la fecha actual en Argentina
 *
 * @returns Fecha actual en Argentina
 */
export const obtenerFechaActualArgentina = (): Date => {
  const now = new Date()
  return normalizarFechaArgentina(now)
}

/**
 * Obtiene la fecha actual en formato ISO (yyyy-MM-dd) para usar en inputs de tipo date
 *
 * @returns String en formato ISO (yyyy-MM-dd)
 */
export const obtenerFechaActualISO = (): string => {
  return fechaToISOString(obtenerFechaActualArgentina())
} 