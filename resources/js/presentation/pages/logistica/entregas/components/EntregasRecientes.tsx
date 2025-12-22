import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Eye } from 'lucide-react';
import type { EntregaReciente } from '@/application/hooks/use-entregas-dashboard-stats';

interface EntregasRecientesProps {
    entregas: EntregaReciente[];
    loading: boolean;
    onVerEntrega?: (entregaId: number) => void;
}

const estadoBadgeConfig: Record<string, { bg: string; text: string }> = {
    PROGRAMADO: { bg: 'bg-blue-100', text: 'text-blue-800' },
    ASIGNADA: { bg: 'bg-purple-100', text: 'text-purple-800' },
    EN_CAMINO: { bg: 'bg-orange-100', text: 'text-orange-800' },
    LLEGO: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    ENTREGADO: { bg: 'bg-green-100', text: 'text-green-800' },
    NOVEDAD: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    CANCELADA: { bg: 'bg-red-100', text: 'text-red-800' },
};

export function EntregasRecientes({
    entregas,
    loading,
    onVerEntrega,
}: EntregasRecientesProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Entregas Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!entregas || entregas.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Entregas Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-8">
                    No hay entregas recientes
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Entregas Recientes (Últimas 10)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {entregas.map((entrega) => {
                        const badgeConfig =
                            estadoBadgeConfig[
                                entrega.estado as keyof typeof estadoBadgeConfig
                            ] || estadoBadgeConfig.PROGRAMADO;

                        return (
                            <div
                                key={entrega.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">
                                            #{entrega.id}
                                        </span>
                                        <Badge
                                            className={`${badgeConfig.bg} ${badgeConfig.text}`}
                                            variant="secondary"
                                        >
                                            {entrega.estado}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {entrega.cliente_nombre}
                                    </p>
                                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                        <span>Chofer: {entrega.chofer_nombre}</span>
                                        <span>Vehículo: {entrega.vehiculo_placa}</span>
                                        <span>Peso: {entrega.peso_kg} kg</span>
                                    </div>
                                    {entrega.fecha_entrega && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Entregado: {entrega.fecha_entrega}
                                        </div>
                                    )}
                                </div>
                                {onVerEntrega && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onVerEntrega(entrega.id)}
                                        className="ml-2 flex-shrink-0"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
