import { getEstadoLabel, getEstadoIcon, getEstadoBgColor } from '@/lib/entregas.utils';

interface EntregaEstadoBadgeProps {
  estado: string;
  showIcon?: boolean;
  className?: string;
}

export function EntregaEstadoBadge({
  estado,
  showIcon = true,
  className
}: EntregaEstadoBadgeProps) {
  const bgColor = getEstadoBgColor(estado);

  return (
    <div className={`gap-2 flex items-center w-fit px-3 py-1 rounded-full font-medium text-sm ${bgColor} ${className || ''}`}>
      {showIcon && (
        <>
          {getEstadoIcon(estado)}
        </>
      )}
      {getEstadoLabel(estado)}
    </div>
  );
}
