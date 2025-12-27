import { Badge } from '@/presentation/components/ui/badge';
import { getEstadoBadge } from '@/domain/entities/proformas';

interface ProformaEstadoBadgeProps {
    estado: string;
    className?: string;
}

export function ProformaEstadoBadge({ estado, className }: ProformaEstadoBadgeProps) {
    const { label, variant } = getEstadoBadge(estado);

    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    );
}
