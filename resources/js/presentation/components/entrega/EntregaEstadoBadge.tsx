/**
 * Badge de Estado para Entregas
 *
 * Componente con integración completa a estados centralizados (Fase 3).
 * Usa hooks dinámicos para obtener datos desde la API.
 * Fallback automático a datos hardcodeados si el hook no está disponible.
 *
 * @phase Fase 3.6: Refactorización con hooks dinámicos
 */

import { useMemo } from 'react';
import { useEntregaEstadoBadge } from '@/application/hooks';
import { getEstadoLabel, getEstadoIcon, getEstadoBgColor } from '@/lib/entregas.utils';

interface EntregaEstadoBadgeProps {
  estado: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Componente Badge para mostrar el estado de una entrega
 *
 * Usa hook dinámico para obtener información del estado desde la API.
 * Fallback automático a utils hardcodeadas si los datos no están disponibles.
 *
 * @example
 * <EntregaEstadoBadge estado="ENTREGADO" showIcon={true} />
 *
 * @example
 * // Dentro de EstadosProvider (Fase 3)
 * <EstadosProvider>
 *   <EntregaEstadoBadge estado="ENTREGADO" />
 * </EstadosProvider>
 */
export function EntregaEstadoBadge({
  estado,
  showIcon = true,
  className
}: EntregaEstadoBadgeProps) {
  // Fase 3.6: Integración con hook dinámico
  const getEstadoBadgeInfo = useEntregaEstadoBadge();

  // Obtener información dinámica del estado
  const memoizedContent = useMemo(() => {
    const badgeInfo = getEstadoBadgeInfo(estado);

    if (badgeInfo) {
      return {
        bgColor: badgeInfo.bgColor,
        textColor: badgeInfo.textColor,
        label: badgeInfo.label,
        icon: badgeInfo.icon,
      };
    }

    // Fallback a funciones hardcodeadas si no hay información dinámica
    return {
      bgColor: getEstadoBgColor(estado),
      textColor: '', // No se usa en fallback
      label: getEstadoLabel(estado),
      icon: getEstadoIcon(estado),
    };
  }, [estado, getEstadoBadgeInfo]);

  return (
    <div className={`gap-2 flex items-center w-fit px-3 py-1 rounded-full font-medium text-sm ${memoizedContent.bgColor} ${className || ''}`}>
      {showIcon && (
        <>
          {memoizedContent.icon}
        </>
      )}
      {memoizedContent.label}
    </div>
  );
}
