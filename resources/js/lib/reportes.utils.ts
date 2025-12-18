import type { TIPO_PRECIO_COLOR_MAP, ESTADO_GANANCIA_CONFIG, EstadoGanancia } from '@/domain/entities/reportes';

/**
 * Obtiene la clase CSS para el color del tipo de precio
 * @param color - Color definido en el tipo de precio
 * @returns Clase CSS de Tailwind para mostrar el badge
 */
export function getColorClass(color: string): string {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    pink: 'bg-pink-100 text-pink-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
    teal: 'bg-teal-100 text-teal-800',
  };

  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
}

/**
 * Obtiene la clase CSS para el color del porcentaje de ganancia
 * @param porcentaje - Porcentaje de ganancia
 * @returns Clase CSS de Tailwind para el texto
 */
export function getGananciaColor(porcentaje: number): string {
  if (porcentaje >= 30) return 'text-green-600';
  if (porcentaje >= 15) return 'text-green-500';
  if (porcentaje >= 5) return 'text-yellow-600';
  if (porcentaje >= 0) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Obtiene el estado de ganancia basado en el porcentaje
 * @param porcentaje - Porcentaje de ganancia
 * @returns Estado de ganancia con su configuración
 */
export function getEstadoGanancia(porcentaje: number): {
  estado: EstadoGanancia;
  label: string;
  icon: string;
  badge: string;
  textColor: string;
} {
  let estado: EstadoGanancia;

  if (porcentaje >= 30) {
    estado = 'excelente' as EstadoGanancia;
  } else if (porcentaje >= 15) {
    estado = 'bueno' as EstadoGanancia;
  } else if (porcentaje >= 5) {
    estado = 'regular' as EstadoGanancia;
  } else if (porcentaje >= 0) {
    estado = 'bajo' as EstadoGanancia;
  } else {
    estado = 'perdida' as EstadoGanancia;
  }

  const config = ESTADO_GANANCIA_CONFIG[estado];
  return {
    estado,
    label: config.label,
    icon: config.icon,
    badge: config.badge,
    textColor: config.textColor,
  };
}

/**
 * Formatea un valor monetario según la moneda especificada
 * @param value - Valor a formatear
 * @param currency - Código de moneda (default: BOB)
 * @param locale - Locale para el formato (default: es-BO)
 * @returns Valor formateado como moneda
 */
export function formatCurrency(
  value: number,
  currency: string = 'BOB',
  locale: string = 'es-BO'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un valor monetario con decimales
 * @param value - Valor a formatear
 * @param currency - Código de moneda (default: BOB)
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para el formato (default: es-BO)
 * @returns Valor formateado como moneda
 */
export function formatCurrencyWithDecimals(
  value: number,
  currency: string = 'BOB',
  decimals: number = 2,
  locale: string = 'es-BO'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatea un porcentaje
 * @param value - Valor a formatear
 * @param decimals - Número de decimales (default: 1)
 * @returns Valor formateado como porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea una fecha sin incluir hora
 * @param date - Fecha a formatear (string o Date)
 * @param locale - Locale para el formato (default: es-ES)
 * @returns Fecha formateada (ej: 17 de diciembre de 2025)
 */
export function formatDateOnly(date: string | Date, locale: string = 'es-ES'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
